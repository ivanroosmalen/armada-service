const settings = require('../settings.js');
const { UserAcademyPayment } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const userService = require('../services/user-service.js');
const academyService = require('../services/academy-service.js');
const academyMemberService = require('../services/academyMember-service.js');
const paymentService = require('../services/payment-service.js');
const PaymentController = require('../controllers/payment-controller.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: UserAcademyPayment },
        type: 'mongoose'
    },
    controller: new PaymentController(paymentService, userService, academyService, academyMemberService),
    customRoutes: {
        createPaymentMethod: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        updatePaymentMethod: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        listPaymentMethods: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        createSubscription: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        cancelSubscription: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        updateSubscription: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getProductsAndPricing: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getUserAcademyPayment: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        paymentWebhook: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
    }
}, settings);

module.exports = handler;
