const settings = require('../settings.js');
const { AcademyMember, AcademyRequest, User, Academy } = require('../models/models.js');
const UserService = require('../services/user-service.js');
const AcademyService = require('../services/academy-service.js');
const AcademyRequestService = require('../services/academyRequestService-service.js');
const AcademyMemberService = require('../services/academyMember-service.js');
const AcademyMemberController = require('../controllers/academyMember-controller.js');
const { getHandler } = require('./baseHandler.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: AcademyRequest },
        type: 'mongoose'
    },
    controller: new AcademyMemberController( new AcademyMemberService(AcademyMember), new AcademyRequestService(AcademyRequest), new UserService(User), new AcademyService(Academy)),
    customRoutes: {
        createRequest: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getRequestsByAcademyId: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        listRequests: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors),  authentication(), errorHandler()],
        approve: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors),  authentication(), errorHandler()]
    }
}, settings);

module.exports = handler;
