const MongooseService = require('./mongoose-service');
const { UserAcademyPayment } = require('../models/models.js');
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

  async updateUserAcademyPayment(id, userAcademyPayment) {
      return this.update(id, userAcademyPayment)
  };

  async findUserAcademyPaymentByAcademyIdAndUserId(academyId, userId) {
      if(!academyId || !userId) {
          throw new Error('Must pass in an academy id and userId');
      }

      return this.schema.findOne({ academyId, userId });
  };

  async findUserAcademyPaymentByAcademyId(academyId) {
      if(!academyId) {
          throw new Error('Must pass in an academy id');
      }

      return this.schema.findOne({ academyId });
  };

  async findUserAcademyPaymentBySubscriptionId(subscriptionId) {
      if(!subscriptionId) {
          throw new Error('Must pass in an subscription id');
      }

      return this.schema.findOne({ subscriptionId });
  };

}

module.exports = new PaymentService(UserAcademyPayment)
