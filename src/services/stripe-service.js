const settings = require('../settings.js');
const stripe = require('stripe')(settings.membership.stripe.secretKey);

async function createSubscription(email, productId) {

  const customer = await stripe.customers.create({
    email,
  });
}
