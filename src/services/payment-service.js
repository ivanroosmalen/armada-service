const MongooseService = require('./mongoose-service');
const settings = require('../settings');

class PaymentService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async createUserAcademyPayment(userAcademyPayment) {
      if(!userAcademyPayment) {
          throw new Error('Must pass in a userAcademyPayment');
      }

      return this.schema.create(userAcademyPayment);
  };

  async findUserAcademyPaymentByAcademyIdAndUserId(academyId, userId) {
      if(!academyId) {
          throw new Error('Must pass in an academy id');
      }

      return this.schema.findOne({ academyId, userId });
  };

}

module.exports = PaymentService
