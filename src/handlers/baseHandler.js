const {
    defineMiddlewareStack,
    errorHandler,
    authentication
} = require('../utils/middleware.js');

const BaseController = require('../controllers/base-controller.js');
const MongooseService = require('../services/mongoose-service.js');

const mongooseUtils = require('../utils/mongoose-utils.js');

const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const createControllerRoutes = (controller, routeDefinitions) => {
    let routes = {};
    Object.entries(routeDefinitions).forEach(([route, middlewares]) =>
        routes[route] = defineMiddlewareStack(controller[route].bind(controller), middlewares));
    return routes;
};

const buildMainStack = stackOptions => {
    let service;
    switch (stackOptions.type) {
    case 'mongoose':
        service = new MongooseService(stackOptions.validation.schema);
        break;
    default:
        service = new MongooseService(stackOptions.validation.schema);
        break;
    }

    return new BaseController(service);
};

const getHandler = ({ stackOptions = {}, controller, customRoutes = {} }, settings) => {
    if (stackOptions.type === 'mongoose') {
        mongooseUtils.dbSetup(settings.mongo);
    }

    if (!controller) {
        controller = buildMainStack(stackOptions);
    }

    let baseRoutes = {
        create: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        batchCreate: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        update: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        delete: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        get: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
        list: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors),authentication(),  errorHandler()]
    };

    return createControllerRoutes(controller, Object.assign(baseRoutes, customRoutes));
};

module.exports = {
    getHandler,
    buildMainStack,
    createControllerRoutes
};
