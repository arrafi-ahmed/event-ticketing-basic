const { VUE_BASE_URL, STRIPE_SECRET } = process.env;
const stripe = require("stripe")(STRIPE_SECRET);
const { sql } = require("../db");

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
        insert into stripe_product ${sql(payload)}
        on conflict (id)
        do update set ${sql(payload)} returning *`;
  return insertedStripeProduct;
};

exports.deleteStripeProduct = async ({ id }) => {
  const [deletedStripeProduct] = await sql`
        delete
        from stripe_product
        where id = ${id}
        returning *`;
  return deletedStripeProduct;
};

exports.createProductPrice = async ({ product, price }) => {
  console.log(3, product, price);
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

exports.getStripeProductByEventId = async ({ eventId }) => {
  const [stripeProduct] = await sql`
        select *
        from stripe_product
        where event_id = ${eventId}`;
  return stripeProduct;
};

exports.createCheckout = async ({ payload }) => {
  const stripeProduct = await exports.getStripeProductByEventId({
    eventId: payload.eventId,
  });

  const returnRoute = `${VUE_BASE_URL}/club/${payload.clubId}/event/${payload.eventId}/success`;
  const params = new URLSearchParams();
  // params.append("session_id", "{CHECKOUT_SESSION_ID}");
  params.append("redirect_stripe", "1");
  params.append("registration_id", payload.registrationId);
  params.append("uuid", payload.uuid);

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        price: stripeProduct.priceId,
        quantity: 1,
      },
    ],
    mode: "payment",
    return_url: `${returnRoute}?session_id={CHECKOUT_SESSION_ID}&${params.toString()}`,
  });
  return { clientSecret: session.client_secret };
};

exports.sessionStatus = async ({ sessionId }) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session.status;
};
//http://localhost:3000/club/8/event/30/success?session_id=%7BCHECKOUT_SESSION_ID%7D&redirect_stripe=1&registration_id=221&uuid=0a956b62-0dc0-47fe-97be-8c7ab5fd7bb0
