const settings = require('../settings.js');
const { Class, User, Academy } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const ClassController = require('../controllers/class-controller.js');
const ClassService = require('../services/class-service.js');
const UserService = require('../services/user-service.js');
const AcademyService = require('../services/academy-service.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Class },
        type: 'mongoose'
    },
    controller: new ClassController(new ClassService(Class), new UserService(User), new AcademyService(Academy)),
    customRoutes: {
        attend: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        unattend: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getAttendanceMetrics: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        getTotalAttendanceMetrics: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()]
    }
}, settings);

module.exports = handler;
