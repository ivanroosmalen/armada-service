const settings = require('../settings');
const MongooseService = require('./mongoose-service');

class ScheduleItemService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

}

module.exports = ScheduleItemService;
