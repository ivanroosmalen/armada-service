const settings = require('../settings.js');
const { Location } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const LocationService = require('../services/location-service.js');
const BaseController = require('../controllers/base-controller.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Location },
        type: 'mongoose'
    },
    controller: new BaseController(location),
    customRoutes: {
    }
}, settings);

module.exports = handler;
