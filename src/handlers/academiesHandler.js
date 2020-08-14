const settings = require('../settings.js');
const { Academy, User, Location } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const UserService = require('../services/user-service.js');
const AcademyService = require('../services/academy-service.js');
const LocationService = require('../services/location-service.js');
const AcademyController = require('../controllers/academy-controller.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Academy },
        type: 'mongoose'
    },
    controller: new AcademyController(new AcademyService(Academy), new UserService(User), new LocationService(Location)),
    customRoutes: {
        uploadImage: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getUserAcademies: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()]
    }
}, settings);

module.exports = handler;
