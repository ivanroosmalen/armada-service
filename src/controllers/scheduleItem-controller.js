const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');

class ScheduleItemController extends BaseController {
    constructor(scheduleItemService) {
        super(scheduleItemService);
    }

}

module.exports = ScheduleItemController
