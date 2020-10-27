const settings = require('../settings.js');
const { AcademyMember } = require('../models/models.js');
const userService = require('../services/user-service.js');
const academyService = require('../services/academy-service.js');
const academyRequestService = require('../services/academyRequest-service.js');
const academyMemberService = require('../services/academyMember-service.js');
const AcademyMemberController = require('../controllers/academyMember-controller.js');
const { getHandler } = require('./baseHandler.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: AcademyMember },
        type: 'mongoose'
    },
    controller: new AcademyMemberController( academyMemberService, academyRequestService, userService, academyService),
    customRoutes: {
    }
}, settings);

module.exports = handler;
