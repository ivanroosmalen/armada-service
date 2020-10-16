const MongooseService = require('./mongoose-service');
const { AcademyMember } = require('../models/models.js');
const settings = require('../settings');

class AcademyMemberService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async findByUserId(userId) {
      if(!userId) {
          throw new Error('Must pass in a userId');
      }

      return this.schema.find({ 'member._id': userId });
  };

  async userUpdated(userId, entity) {
    let academyMembers = await this.findByUserId(userId);

    let updates = [];
    for(let academyMembers of academyMember) {
      Object.assign(academyMember, entity)
      updates.push(this.update(academyMember._id, academyMember));
    }

    await Promise.all(updates);
  }

}

module.exports = new AcademyMemberService(AcademyMember)
