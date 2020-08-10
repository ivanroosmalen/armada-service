const MongooseService = require('./mongoose-service');
const settings = require('../settings');

class ClassService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async findByParentIdAndStartDate(parentId, startDate) {
      if(!(parentId && startDate)) {
          throw new Error('Cannot find a parent id or startDate');
      }

    return this.schema.findOne({ parentId, 'schedule.startDate': startDate });
  };
}

module.exports = ClassService
