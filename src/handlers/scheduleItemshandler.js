const settings = require('../settings.js');
const { ScheduleItem } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const ScheduleItemService = require('../services/scheduleItem-service.js');
const ScheduleItemController = require('../controllers/scheduleItem-controller.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: ScheduleItem },
        type: 'mongoose'
    },
    controller: new ScheduleItemController(new ScheduleItemService(ScheduleItem)),
    customRoutes: {
    }
}, settings);

module.exports = handler;
