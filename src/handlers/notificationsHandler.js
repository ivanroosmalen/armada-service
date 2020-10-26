const settings = require('../settings.js');
const { Notification } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const NotificationController = require('../controllers/notification-controller.js');
const academyService = require('../services/academy-service.js');
const academyMemberService = require('../services/academyMember-service.js');
const userService = require('../services/user-service.js');
const NotificationService = require('../services/mongoose-service.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Notification },
        type: 'mongoose'
    },
    controller: new NotificationController(new NotificationService(Notification), userService, academyService, academyMemberService),
    customRoutes: {
        get: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        list: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
    }
}, settings);

module.exports = handler;
