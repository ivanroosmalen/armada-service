const settings = require('../settings.js');
const { Academy } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const userService = require('../services/user-service.js');
const academyService = require('../services/academy-service.js');
const locationService = require('../services/location-service.js');
const AcademyController = require('../controllers/academy-controller.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Academy },
        type: 'mongoose'
    },
    controller: new AcademyController(academyService, userService, locationService),
    customRoutes: {
        uploadImage: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getUserAcademies: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        cancelMembership: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
    }
}, settings);

module.exports = handler;
