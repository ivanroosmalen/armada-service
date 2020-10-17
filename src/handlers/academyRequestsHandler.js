// DEPRECATED

const settings = require('../settings.js');
const { AcademyRequest } = require('../models/models.js');
const userService = require('../services/user-service.js');
const academyService = require('../services/academy-service.js');
const academyRequestService = require('../services/academyRequest-service.js');
const academyMemberService = require('../services/academyMember-service.js');
const AcademyRequestController = require('../controllers/academyRequest-controller.js');
const { getHandler } = require('./baseHandler.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: AcademyRequest },
        type: 'mongoose'
    },
    controller: new AcademyRequestController( academyRequestService, userService, academyService, academyMemberService),
    customRoutes: {
        getByAcademyId: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        list: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors),  authentication(), errorHandler()],
        approve: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors),  authentication(), errorHandler()]
    }
}, settings);

module.exports = handler;
