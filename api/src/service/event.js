const CustomError = require("../model/CustomError");
const { sql } = require("../db");
const { removeImages, getApiPublicImgUrl } = require("../others/util");
const stripeService = require("../service/stripe");

exports.save = async ({ payload, files, currentUser }) => {
  const newEvent = {
    ...payload,
    clubId: currentUser.clubId,
    createdBy: currentUser.id,
  };
  //if add event
  if (!newEvent.id) {
    newEvent.registrationCount = 0;
  } else if (currentUser.role != "sudo") {
    //if updating event make sure user is authorized
    const [event] = await exports.getEventByEventIdnClubId({
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
  const [insertedEvent] = await sql`
        insert into event ${sql(newEvent)}
        on conflict (id)
        do update set ${sql(newEvent)} returning *`;

  // stripe product
  const eventBanner = getApiPublicImgUrl(newEvent.banner, "event-banner");
  const newProduct = {
    name: newEvent.name,
    description: newEvent.description,
    images: [eventBanner],
    metadata: {
      eventId: insertedEvent.id,
      eventName: insertedEvent.name,
      clubId: insertedEvent.clubId,
      ticketPrice: insertedEvent.ticketPrice,
    },
  };
  const newPrice = {
    currency: "eur",
    unit_amount: Math.round(Number(insertedEvent.ticketPrice) * 100),
  };
  // if add event
  if (!newEvent.id && insertedEvent?.ticketPrice > 0) {
    const productPrice = await stripeService.createProductPrice({
      product: newProduct,
      price: newPrice,
    });
  }
  // if edit event
  else if (newEvent.id) {
    let stripeProduct = await stripeService.getStripeProductByEventId({
      eventId: insertedEvent.id,
    });
    // if before it's free event and no stripe product created, create now
    if (!stripeProduct && insertedEvent?.ticketPrice > 0) {
      stripeProduct = await stripeService.createProductPrice({
        product: newProduct,
        price: newPrice,
      });
    }
    const retrievedProduct = await stripeService.retrieveProduct({
      id: stripeProduct.productId,
    });
    if (retrievedProduct) {
      // update stripe api product if old product != new product
      if (
        newProduct.name != retrievedProduct.name ||
        newProduct.description != retrievedProduct.description ||
        (files && files.length > 0)
      ) {
        await stripeService.updateProduct({
          id: stripeProduct.productId,
          payload: newProduct,
        });
      }
      // update stripe api price if old price != new price
      if (
        newProduct.metadata.ticketPrice != retrievedProduct.metadata.ticketPrice
      ) {
        // create new price
        const createdPrice = await stripeService.createPrice({
          payload: { ...newPrice, product: stripeProduct.productId },
        });

        //deactivate old price
        await stripeService.updatePrice({
          id: stripeProduct.priceId,
          payload: { active: false },
        });

        // update stripe_product
        await stripeService.saveStripeProduct({
          payload: {
            ...stripeProduct,
            priceId: createdPrice.id,
          },
        });
      }
    }
  }

  return insertedEvent;
};

exports.removeEvent = async ({ eventId, clubId }) => {
  const [deletedEvent] = await sql`
        delete
        from event
        where id = ${eventId}
          and club_id = ${clubId}
        returning *;`;

  if (deletedEvent.banner) {
    await removeImages([deletedEvent.banner]);
  }
  return deletedEvent;
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
