const settings = require('../settings.js');
const { Class } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const ClassController = require('../controllers/class-controller.js');
const classService = require('../services/class-service.js');
const userService = require('../services/user-service.js');
const academyService = require('../services/academy-service.js');
const academyMemberService = require('../services/academyMember-service.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Class },
        type: 'mongoose'
    },
    controller: new ClassController(classService, userService, academyService, academyMemberService),
    customRoutes: {
        attend: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        unattend: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        batchAttend: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getAttendanceMetrics: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getTotalAttendanceMetrics: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()]
    }
}, settings);

module.exports = handler;
