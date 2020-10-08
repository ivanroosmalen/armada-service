const BaseController = require('./base-controller.js');
const emailService = require('../services/email-service.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const stripe = require('stripe')(settings.membership.stripe.secretKey);

class PaymentController extends BaseController {
    constructor(paymentService, userService, academyService) {
        super(paymentService);

        this.userService = userService;
        this.academyService = academyService;
    }

    async createPaymentMethod(event) {
      let paymentMethod = event.body;
      let { _id, email } = event.user

      if(!(_id && email)) {
        return handleError(400, 'You need to pass a valid object');
      }

      let user = await this.userService.findById(_id);
      if(!user) {
        return handleError(400, 'User does not exist');
      }

      try {
        let pm = await stripe.paymentMethods.create({
          type: 'card',
          card: { token: paymentMethod.tokenId }
        });

        if(!user.stripeCustomerId) {
          let customer = await stripe.customers.create({
            email,
            name: _id
          });

          user.stripeCustomerId = customer.id;
          await this.userService.update(_id, user);
        }

        await stripe.paymentMethods.attach(pm.id, {
          customer: user.stripeCustomerId,
        });

        await stripe.customers.update(
            user.stripeCustomerId,
            {
              invoice_settings: {
                default_payment_method: pm.id,
              }
            }
          );
      } catch(e) {
        return handleError(500, 'Unable to create payment method', e);
      }

      return {
          statusCode: 201,
          body: JSON.stringify({
              message: 'Payment method created',
          })
      };
    }

    async updatePaymentMethod(event) {
      let paymentMethod = event.body;
      let { _id } = event.user

      if(!(_id)) {
        return handleError(400, 'You need to pass a valid object');
      }

      let user = await this.userService.findById(_id);
      if(!(user && user.stripeCustomerId)) {
        return handleError(400, 'Customer does not exist');
      }

      try {
        let pm = await stripe.paymentMethods.create(paymentMethod);

        await stripe.paymentMethods.attach(pm.id, {
          customer: user.stripeCustomerId,
        });

        await stripe.customers.update(
            user.stripeCustomerId,
            {
              invoice_settings: {
                default_payment_method: pm.id,
              }
            }
          );
      } catch(e) {
        return handleError(500, 'Unable to update payment method', e);
      }

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Payment method updated',
          })
      };
    }

    async listPaymentMethods(event) {
      let { _id } = event.user

      if(!(_id)) {
        return handleError(400, 'You need to pass a valid object');
      }

      let user = await this.userService.findById(_id);
      if(!(user && user.stripeCustomerId)) {
        return handleError(400, 'Customer does not exist');
      }

      let entities = [];
      try {
        entities = await stripe.paymentMethods.list({
          customer: user.stripeCustomerId,
          type: 'card'
        });

        entities = entities ? entities.data : [];
      } catch(e) {
        return handleError(500, 'Unable to update payment method', e);
      }

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Payment method found',
              entities
          })
      };
    }

    async createSubscription(event) {
      let { priceId, academyId, paymentMethodId, locale } = event.body;
      let userId = event.user._id

      if(!priceId) {
        return handleError(400, 'You need to pass a valid price id');
      }

      let promises = await Promise.all([
        this.userService.findById(userId),
        this.academyService.findById(academyId),
        stripe.prices.retrieve(priceId)
      ]);

      let user = promises[0];
      let academy = promises[1];
      let price = promises[2];
      let isAcademyOwner = academy && academy.owners.find(owner => (owner._id === userId));

      if(!(user && isAcademyOwner)) {
        return handleError(401, 'Unauthorized');
      }

      if(!user || !user.stripeCustomerId) {
        return handleError(400, 'User requires a customer id');
      }

      promises = await Promise.all([
        stripe.subscriptions.create({
          customer: user.stripeCustomerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethodId
        }),
        stripe.products.retrieve(
          price.product
        )
      ])

      // Create the subscription
      const subscription = promises[0];
      const product = promises[1];

      let userAcademyPayment = {
        userId: userId,
        academyId: academyId,
        subscriptionId: subscription.id,
        status: subscription.status
      }

      academy.memberLimit = parseInt(product.metadata.members);
      let ownerIds = academy.owners.map(owner => (owner._id));
      promises = await Promise.all([
        this.service.create(userAcademyPayment),
        this.academyService.update(academy._id, academy),
        this.userService.listPrivate({_id: { $in: ownerIds }})
      ])

      let ownerEmails = promises[2].map(owner => (owner.email));
      await emailService.sendSubscriptionEmail(ownerEmails, academy, locale);

      return {
          statusCode: 201,
          body: JSON.stringify({
              message: 'Subscription created',
          })
      };
    }

    async updateSubscription(event) {
      let { priceId, academyId, paymentMethodId, locale } = event.body;
      let userId = event.user._id

      let promise = await Promise.all([
        this.userService.findById(userId),
        this.academyService.findById(academyId)
      ]);

      let user = promise[0];
      let academy = promise[1];
      let isAcademyOwner = academy && academy.owners.find(owner => (owner._id === userId));

      if(!(user && isAcademyOwner)) {
        return handleError(401, 'Unauthorized');
      }

      let userAcademyPayment = await this.service.findUserAcademyPaymentByAcademyId(academyId);

      let subscription = await stripe.subscriptions.retrieve(
        userAcademyPayment.subscriptionId
      )

      let subscriptionBody = {};
      if(priceId) {
        let price = await stripe.prices.retrieve(priceId);
        let product = await stripe.products.retrieve(price.product);

        if(price) {
          subscriptionBody = { items: [{
            id: subscription.items.data[0].id,
            price: price.id
          }] }
        }

        academy.memberLimit = parseInt(product.metadata.members);
      }

      if(paymentMethodId) {
        subscriptionBody.default_payment_method = paymentMethodId;
      }

      subscription = await stripe.subscriptions.update(
        userAcademyPayment.subscriptionId,
        subscriptionBody
      );

      userAcademyPayment.status = subscription.status;
      let ownerIds = academy.owners.map(owner => (owner._id));
      let promises = await Promise.all([
        this.service.update(userAcademyPayment._id, userAcademyPayment),
        this.academyService.update(academy._id, academy),
        this.userService.listPrivate({_id: { $in: ownerIds }})
      ])

      let ownerEmails = promises[2].map(owner => (owner.email));
      await emailService.sendSubscriptionEmail(ownerEmails, academy, locale);

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Subscription updated',
          })
      };
    }

    async cancelSubscription(event) {
      let { academyId, locale } = event.body;
      let userId = event.user._id

      let promise = await Promise.all([
        this.userService.findById(userId),
        this.academyService.findById(academyId)
      ]);

      let user = promise[0];
      let academy = promise[1];
      let isAcademyOwner = academy && academy.owners.find(owner => (owner._id === userId));

      if(!(user && isAcademyOwner)) {
        return handleError(401, 'Unauthorized');
      }

      let userAcademyPayment = await this.service.findUserAcademyPaymentByAcademyId(academyId);

      const subscription = await stripe.subscriptions.del(
        userAcademyPayment.subscriptionId
      );

      academy.memberLimit = 5;
      let ownerIds = academy.owners.map(owner => (owner._id));
      let promises = await Promise.all([
        this.service.deleteById(userAcademyPayment._id),
        this.academyService.update(academy._id, academy),
        this.userService.listPrivate({_id: { $in: ownerIds }})
      ])

      let ownerEmails = promises[2].map(owner => (owner.email));
      await emailService.sendSubscriptionCancelledEmail(ownerEmails, academy, locale);

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Subscription cancelled',
          })
      };
    }

    async getProductsAndPricing(event) {
      let prices = await stripe.prices.list();
      prices = prices ? prices.data : [];

      let products = await stripe.products.list();
      products = products ? products.data.filter(product => (product.metadata.version === settings.membership.version)) : [];

      let productPrices = [];
      prices.forEach(price => {
        let product = products.find(product => product.id === price.product);
        let productPrice = { price, product };
        productPrices.push(productPrice)
      })

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Retrieved products and pricing',
              entities: productPrices
          })
      };
    }

    async getUserAcademyPayment(event) {
        let { academyId } = event.pathParameters;
        let userId = event.user._id

        let promise = await Promise.all([
          this.userService.findById(userId),
          this.academyService.findById(academyId)
        ]);

        let user = promise[0];
        let academy = promise[1];
        let isAcademyOwner = academy && academy.owners.find(owner => (owner._id === userId));

        if(!(user && isAcademyOwner)) {
          return handleError(401, 'Unauthorized');
        }

        let entity = await this.service.findUserAcademyPaymentByAcademyId(academyId);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Retrieved user-academy-payment',
                entity: entity
            })
        };
    }

    async paymentWebhook(event) {

      console.log(event.body)
    }

    async create(event) {
    };

    async batchCreate(event) {
    }

    async update(event) {
    };

    async get(event) {
    };

    async list(event) {
    };

    async delete(event) {

    };

    _getListQuery(queryParams) {

    }
}

module.exports = PaymentController
