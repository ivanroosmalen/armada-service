const MongooseService = require('./mongoose-service');
const settings = require('../settings');

class AcademyMemberService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

}

module.exports = AcademyMemberService
