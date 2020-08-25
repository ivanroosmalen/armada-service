const settings = require('../settings.js');
const { AcademyRequest, User, Academy } = require('../models/models.js');
const UserService = require('../services/user-service.js');
const AcademyService = require('../services/academy-service.js');
const AcademyRequestService = require('../services/academyRequest-service.js');
const AcademyRequestController = require('../controllers/academyRequest-controller.js');
const { getHandler } = require('./baseHandler.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: AcademyRequest },
        type: 'mongoose'
    },
    controller: new AcademyRequestController( new AcademyRequestService(AcademyRequest), new UserService(User), new AcademyService(Academy)),
    customRoutes: {
        getByAcademyId: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        list: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors),  authentication(), errorHandler()],
        approve: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors),  authentication(), errorHandler()]
    }
}, settings);

module.exports = handler;
