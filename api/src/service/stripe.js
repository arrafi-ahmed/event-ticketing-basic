const { VUE_BASE_URL, STRIPE_SECRET } = process.env;
const stripe = require("stripe")(STRIPE_SECRET);
const { sql } = require("../db");
const CustomError = require("../model/CustomError");
const registrationService = require("./registration");
const eventService = require("./event");

exports.createProduct = async ({ payload }) => {
  const createdProduct = await stripe.products.create(payload);
  return createdProduct;
};

exports.updateProduct = async ({ id, payload }) => {
  const updatedProduct = await stripe.products.update(id, payload);
  return updatedProduct;
};

exports.deleteProduct = async ({ id }) => {
  const deletedProduct = await stripe.products.del(id);
  return deletedProduct;
};

exports.retrieveProduct = async ({ id }) => {
  const retrievedProduct = await stripe.products.retrieve(id);
  return retrievedProduct;
};

exports.createPrice = async ({ payload }) => {
  const createdPrice = await stripe.prices.create(payload);
  return createdPrice;
};

exports.updatePrice = async ({ id, payload }) => {
  const updatedPrice = await stripe.prices.update(id, payload);
  return updatedPrice;
};

exports.saveStripeProduct = async ({ payload }) => {
  const [insertedStripeProduct] = await sql`
        insert into stripe_product ${sql(payload)} on conflict (id)
        do
        update set ${sql(payload)} returning *`;
  return insertedStripeProduct;
};

exports.deleteStripeProduct = async ({ id }) => {
  const [deletedStripeProduct] = await sql`
        delete
        from stripe_product
        where id = ${id} returning *`;
  return deletedStripeProduct;
};

exports.createProductPrice = async ({ product, price }) => {
  //create stripe product
  const insertedProduct = await exports.createProduct({
    payload: product,
  });
  price.product = insertedProduct.id;
  //create stripe price
  const insertedPrice = await exports.createPrice({
    payload: price,
  });
  //insert into stripe_product
  const stripeProduct = {
    eventId: product.metadata.eventId,
    productId: insertedProduct.id,
    priceId: insertedPrice.id,
  };
  const insertedStripeProduct = await exports.saveStripeProduct({
    payload: stripeProduct,
  });

  return insertedStripeProduct;
};

exports.deleteProductPrice = async ({ id, productId, priceId }) => {
  // const deletedProduct = await exports.deleteProduct({
  //   id: productId,
  // });
  const deletedStripeProduct = await exports.deleteStripeProduct({
    id,
  });
  return deletedStripeProduct;
};

exports.getStripeProductEventByEventId = async ({ eventId }) => {
  const [stripeProduct] = await sql`
        select *
        from stripe_product sp
                 join event e on e.id = sp.event_id
        where e.id = ${eventId}`;
  return stripeProduct;
};

exports.createStripeCheckoutIfNeeded = async ({
  payload: { savedRegistration, savedExtrasPurchase, extrasIds },
}) => {
  const lineItems = [];
  const stripeProductEvent = await exports.getStripeProductEventByEventId({
    eventId: savedRegistration.eventId,
  });
  if (stripeProductEvent.ticketPrice > 0) {
    lineItems.push({ price: stripeProductEvent.priceId, quantity: 1 });
  }
  const stripeProductEventExtras = await eventService.getExtrasByIds({
    extrasIds,
  });

  stripeProductEventExtras.forEach((item, index) => {
    if (item.price > 0) {
      lineItems.push({ price: item.stripePriceId, quantity: 1 });
    }
  });
  const checkoutPayload = {
    registration: savedRegistration,
    extrasPurchase: savedExtrasPurchase,
    lineItems,
  };
  return exports.createCheckout({
    payload: checkoutPayload,
  });
};

exports.createCheckout = async ({
  payload: { registration, extrasPurchase, lineItems },
}) => {
  const returnRoute = `${VUE_BASE_URL}/club/${registration.clubId}/event/${registration.eventId}/success`;
  const params = new URLSearchParams();
  params.append("registration_id", registration.id);
  params.append("uuid", registration.qrUuid);

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: lineItems,
    mode: "payment",
    return_url: `${returnRoute}?${params.toString()}`,
    metadata: {
      registrationId: registration.id,
      registrationUuid: registration.qrUuid,
      extrasPurchaseId: extrasPurchase.id,
      eventId: registration.eventId,
    },
  });
  return { clientSecret: session.client_secret };
};

exports.sessionStatus = async ({ sessionId }) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.status;
};
//http://localhost:3000/club/8/event/30/success?session_id=%7BCHECKOUT_SESSION_ID%7D&redirect_stripe=1&registration_id=221&uuid=0a956b62-0dc0-47fe-97be-8c7ab5fd7bb0

exports.getPrice = async ({ planTitle }) => {
  const prices =
    planTitle === "premium"
      ? await stripe.prices.list({
          lookup_keys: ["premium"],
        })
      : null;
  return prices && prices.data && prices.data[0];
};

exports.webhook = async (req) => {
  let data;
  let eventType;
  const isDev = process.env.NODE_ENV !== "production";
  // Check if webhook signing is configured.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!isDev && !webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET in production");
  }
  if (webhookSecret) {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;
    let signature = req.headers["stripe-signature"];

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new CustomError(err.message, 400, err);
    }
    // Extract the object from the event.
    data = event.data;
    eventType = event.type;
  } else if (isDev) {
    // Webhook signing is recommended, but if the secret is not configured in `config.js`,
    // retrieve the event data directly from the request body.
    data = req.body.data;
    eventType = req.body.type;
  } else {
    throw new Error(
      "Invalid webhook configuration. Check environment and STRIPE_WEBHOOK_SECRET.",
    );
  }

  let responseMsg = "";
  switch (eventType) {
    // subscription created successfully
    case "checkout.session.completed":
      const checkoutSessionCompleted = data.object;

      await registrationService.updateStatus({
        payload: {
          id: checkoutSessionCompleted.metadata.registrationId,
          uuid: checkoutSessionCompleted.metadata.uuid,
          status: true,
        },
      });
      await eventService.updateExtrasPurchaseStatus({
        payload: {
          id: JSON.parse(checkoutSessionCompleted.metadata.extrasPurchaseId),
          status: true,
        },
      });
      // increase registration_count in event
      await eventService.increaseRegistrationCount({
        eventId: checkoutSessionCompleted.metadata.eventId,
      });
      // send email
      await registrationService.sendTicket({
        registrationId: checkoutSessionCompleted.metadata.registrationId,
      });

      responseMsg = "Purchase successful!";
      break;

    // fired immediately when customer cancel subscription
    case "customer.subscription.updated":
      break;

    // fired at end of period when subscription expired
    case "customer.subscription.deleted":
      break;

    // subscription auto renewal succeeded
    case "invoice.paid":
      break;

    // subscription auto renewal failed
    case "invoice.payment_failed":
      break;

    // ... handle other event types
    default:
      console.error(`Unhandled event type ${eventType}`);
  }

  return responseMsg;
};
/*
stripe trigger checkout.session.completed --override='{
"data": {
  "object": {
    "metadata": {
      "registrationId": "70",
      "uuid": "uuid-94",
      "extrasPurchaseId": "53"
    }
  }
}
}'

stripe trigger checkout.session.completed
--override checkout_session:metadata.registrationId=70
--override checkout_session:metadata.uuid=f3b157dd-7eab-46e1-90d1-e676c65948bb
--override checkout_session:metadata.extrasPurchaseId=53
*/
