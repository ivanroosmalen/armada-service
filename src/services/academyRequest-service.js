const MongooseService = require('./mongoose-service');
const { AcademyRequest } = require('../models/models.js');
const settings = require('../settings');

class AcademyRequestService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async findByAcademyIdAndUserId(academyId, userId, complete, approved) {
      if(!academyId || !userId) {
          throw new Error('Must pass in an academyId and userId');
      }

      let query = {
        'academy._id': academyId,
        'user._id': userId,
      };

      if(complete !== null && complete !== undefined) {
        query.complete = complete
      }

      if(approved !== null && approved !== undefined) {
        query.approved = approved
      }

      return this.schema.findOne(query);
  };

}

module.exports = new AcademyRequestService(AcademyRequest)
