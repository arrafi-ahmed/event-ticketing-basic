const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { removeImages, getApiPublicImgUrl } = require("../others/util");
const stripeService = require("../service/stripe");
const { v4: uuidv4 } = require("uuid");

exports.save = async ({ payload, files, currentUser }) => {
  const newEvent = {
    ...payload,
    clubId: currentUser.clubId,
    createdBy: currentUser.id,
  };
  const shouldCreate = !newEvent.id;
  // create event
  if (shouldCreate) {
    newEvent.registrationCount = 0;
  }
  //update event
  else if (currentUser.role !== "sudo") {
    //if updating event, make sure user is authorized
    const event = await stripeService.getEventStripe({
      eventId: newEvent.id,
      clubId: currentUser.clubId,
    });
    if (!event || !event.id) throw new CustomError("Access denied", 401);
  }
  //add banner
  if (files && files.length > 0) {
    newEvent.banner = files[0].filename;
  }
  //remove banner
  if (payload.rmImage) {
    await removeImages([payload.rmImage]);
    delete newEvent.rmImage;

    if (!newEvent.banner) newEvent.banner = null;
  }
  // if edit event, store original event for using later
  let existingEventWStripe = null;
  if (!shouldCreate) {
    existingEventWStripe = await stripeService.getEventStripe({
      eventId: newEvent.id,
    });
    existingEventWStripe.ticketPrice = Number(existingEventWStripe.ticketPrice);
  }
  const [insertedEvent] = await sql`
    insert into event ${sql(newEvent)} on conflict (id)
        do
    update set ${sql(newEvent)} returning *`;
  insertedEvent.ticketPrice = Number(insertedEvent.ticketPrice);

  await exports.handleStripeSync({
    newEvent: insertedEvent,
    existingEventWStripe,
    files,
    shouldCreate,
  });

  return insertedEvent;
};

exports.handleStripeSync = async ({
  newEvent,
  existingEventWStripe,
  files,
  shouldCreate,
}) => {
  const eventBanner = getApiPublicImgUrl(newEvent.banner, "event-banner");
  const newProduct = {
    name: newEvent.name,
    description: newEvent.description,
    images: [eventBanner],
    metadata: {
      eventId: newEvent.id,
      eventName: newEvent.name,
      clubId: newEvent.clubId,
      ticketPrice: newEvent.ticketPrice,
    },
  };
  const newPrice = {
    currency: "eur",
    unit_amount: Math.round(Number(newEvent.ticketPrice) * 100),
  };
  // if add event
  if (shouldCreate) {
    // if paid event, create product and price
    if (newEvent?.ticketPrice > 0) {
      await stripeService.createProductPrice({
        product: newProduct,
        price: newPrice,
      });
    }
    // if free event, only create product
    else {
      const createdProduct = await stripeService.createProduct({
        payload: newProduct,
      });
      await stripeService.saveEventStripe({
        payload: {
          eventId: newEvent.id,
          productId: createdProduct.id,
        },
      });
    }
  }
  // if edit event
  else {
    // Free → Paid, Create new price and update event_price
    if (existingEventWStripe.ticketPrice < 1 && newEvent?.ticketPrice > 0) {
      const createdPrice = await stripeService.createPrice({
        payload: {
          product: existingEventWStripe.productId,
          ...newPrice,
        },
      });
      await stripeService.saveEventStripe({
        payload: {
          id: existingEventWStripe.esId,
          eventId: existingEventWStripe.eventId,
          productId: existingEventWStripe.productId,
          priceId: createdPrice.id,
        },
      });
    }
    // Paid → Paid, Update if needed
    else if (
      existingEventWStripe.ticketPrice > 0 &&
      newEvent?.ticketPrice > 0
    ) {
      const shouldUpdateProduct =
        newProduct.name !== existingEventWStripe.name ||
        newProduct.description !== existingEventWStripe.description ||
        files?.length > 0;

      if (shouldUpdateProduct) {
        await stripeService.updateProduct({
          id: existingEventWStripe.productId,
          payload: newProduct,
        });
      }

      if (existingEventWStripe.ticketPrice !== newEvent.ticketPrice) {
        const createdPrice = await stripeService.createPrice({
          payload: { ...newPrice, product: existingEventWStripe.productId },
        });

        await stripeService.updatePrice({
          id: existingEventWStripe.priceId,
          payload: { active: false },
        });

        await stripeService.saveEventStripe({
          payload: {
            id: existingEventWStripe.esId,
            eventId: existingEventWStripe.eventId,
            productId: existingEventWStripe.productId,
            priceId: createdPrice.id,
          },
        });
      }
    }
    //  paid -> free, deactivate old price, delete event_stripe
    else if (
      existingEventWStripe.ticketPrice > 0 &&
      newEvent.ticketPrice === 0
    ) {
      await stripeService.updatePrice({
        id: existingEventWStripe.priceId,
        payload: { active: false },
      });
      await stripeService.deleteEventStripe({
        id: existingEventWStripe.esId,
      });
    }
  }
};

exports.saveExtras = async ({ payload, currentUser }) => {
  // check authorization
  if (currentUser.role != "sudo") {
    //if updating event, make sure user is authorized
    const event = await stripeService.getEventStripe({
      eventId: payload.newExtras.eventId,
    });
    if (!event || !event.id) throw new CustomError("Access denied", 401);
  }
  // stripe product
  const newProduct = {
    name: payload.newExtras.name,
    description: payload.newExtras.description,
    images: [],
    metadata: {},
  };
  const newPrice = {
    currency: "eur",
    unit_amount: Math.round(Number(payload.newExtras.price) * 100),
  };
  // if add event
  if (!payload.newExtras.id && payload.newExtras.price > 0) {
    const insertedProduct = await stripeService.createProduct({
      payload: newProduct,
    });
    newPrice.product = insertedProduct.id;
    //create stripe price
    const insertedPrice = await stripeService.createPrice({
      payload: newPrice,
    });
    payload.newExtras.stripeProductId = insertedProduct.id;
    payload.newExtras.stripePriceId = insertedPrice.id;
  }
  // if edit event
  else if (payload.newExtras.id) {
    let extras = await exports.getExtrasById({
      extrasId: payload.newExtras.id,
    });
    // if before it's free event and no stripe product created, create now
    if (!extras.stripeProductId && payload.newExtras?.price > 0) {
      const insertedProduct = await stripeService.createProduct({
        payload: newProduct,
      });
      newPrice.product = insertedProduct.id;
      //create stripe price
      const insertedPrice = await stripeService.createPrice({
        payload: newPrice,
      });
    }
    if (!extras.stripeProductId) {
      const [insertedExtra] = await sql`
        insert into extras ${sql(payload.newExtras)} on conflict (id)
        do
        update set ${sql(payload.newExtras)} returning *`;
      return insertedExtra;
    }

    const retrievedProduct = await stripeService.retrieveProduct({
      id: extras.stripeProductId,
    });
    if (retrievedProduct) {
      // update stripe api product if old product != new product
      if (
        newProduct.name !== retrievedProduct.name ||
        newProduct.description !== retrievedProduct.description
      ) {
        await stripeService.updateProduct({
          id: extras.stripeProductId,
          payload: newProduct,
        });
      }
      // update stripe api price if old price != new price
      if (newProduct.price != retrievedProduct.price) {
        // create new price
        const createdPrice = await stripeService.createPrice({
          payload: { ...newPrice, product: newProduct.productId },
        });

        //deactivate old price
        await stripeService.updatePrice({
          id: newProduct.priceId,
          payload: { active: false },
        });
      }
    }
  }
  const [insertedExtra] = await sql`
    insert into extras ${sql(payload.newExtras)} on conflict (id)
        do
    update set ${sql(payload.newExtras)} returning *`;

  return insertedExtra;
};

exports.saveExtrasPurchase = async ({
  extrasIds,
  registrationId,
  status = false,
}) => {
  const extras = await exports.getExtrasByIds({ extrasIds });
  const newExtrasPurchase = {
    extrasData: [],
    status,
    qrUuid: uuidv4(),
    scannedAt: null,
    registrationId,
  };
  newExtrasPurchase.extrasData = extras.map((item, index) => ({
    name: item.name,
    price: item.price,
    content: item.content,
  }));
  const savedExtrasPurchase =
    await sql`insert into extras_purchase ${sql(newExtrasPurchase)} returning *`;

  return savedExtrasPurchase;
};

exports.updateExtrasPurchaseStatus = async ({ payload: { id, status } }) => {
  const extras = await sql`
    UPDATE extras_purchase
    SET status     = ${status},
        scanned_at = CASE
                       WHEN ${status} = TRUE THEN NOW() -- Set to current timestamp if status is true
                       ELSE scanned_at -- Otherwise, keep its existing value
          END
    WHERE id = ${id} RETURNING *;
  `;
  return extras;
};

exports.getExtrasById = async ({ extrasId }) => {
  const [extra] = await sql`
    select *
    from extras
    where id = ${extrasId}`;
  return extra;
};

exports.getExtrasByIds = async ({ extrasIds }) => {
  const extras = await sql`
    select *
    from extras
    where id in ${sql(extrasIds)}`;
  return extras;
};

exports.getExtrasByEventId = async ({ eventId }) => {
  const extras = await sql`
    select *
    from extras
    where event_id = ${eventId}`;
  return extras;
};

exports.removeEvent = async ({ eventId, clubId }) => {
  const [deletedEvent] = await sql`
    delete
    from event
    where id = ${eventId}
      and club_id = ${clubId} returning *;`;

  if (deletedEvent.banner) {
    await removeImages([deletedEvent.banner]);
  }
  return deletedEvent;
};

exports.removeExtras = async ({ eventId, extrasId }) => {
  const [deletedExtras] = await sql`
    delete
    from extras
    where id = ${extrasId}
      and event_id = ${eventId} returning *;`;

  return deletedExtras;
};

exports.getEvent = async ({ eventId }) => {
  return sql`
    select *
    from event
    where id = ${eventId}`;
};

exports.getEventByEventIdnClubId = async ({ clubId, eventId }) => {
  return sql`
    select *
    from event
    where id = ${eventId}
      and club_id = ${clubId}`;
};

exports.getAllEvents = async ({ clubId }) => {
  return sql`
    select *
    from event
    where club_id = ${clubId}
    order by id desc`;
};

exports.increaseRegistrationCount = async ({ eventId }) => {
  const [updatedEvent] = await sql`
    update event
    set registration_count = registration_count + 1
    where id = ${eventId} returning *;`;
  return updatedEvent;
};

exports.getAllActiveEvents = async ({ clubId, currentDate }) => {
  // const currentDate = new Date().toISOString().split("T")[0]; // Format the date as YYYY-MM-DD
  const results = await sql`
    SELECT *
    FROM event
    WHERE club_id = ${clubId}
      AND ${currentDate}::date < end_date
          AND registration_count < max_attendees
    ORDER BY id DESC;
  `;
  return results;
};
