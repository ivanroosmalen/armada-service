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

  async findOne(query) {
      if(!query) {
          throw new Error('Must pass in a valid query');
      }

      return this.schema.findOne(query);
  };

  async updateUser(userId, entity) {
    let academyMembers = await this.findByUserId(userId);

    let updates = [];
    for(let academyMember of academyMembers) {
      Object.assign(academyMember.member, entity)
      updates.push(this.update(academyMember._id, academyMember));
    }

    await Promise.all(updates);
  }

  async deleteByMemberId(id) {
      if(!id) {
          throw new Error('Cannot delete an entity without a member id');
      }

      return this.schema.deleteOne({ 'member._id': id });
  };

  async countsByAcademyIds(academyIds) {
    let countRequests = [];

    for(let id of academyIds) {
      countRequests.push(this.schema.count({ 'academy._id': id }));
    }

    let counts = await Promise.all(countRequests);
    let response = {};
    academyIds.forEach((id, index) => {
      response[id.toString()] = counts[index];
    })

    return response;
  }

}

module.exports = new AcademyMemberService(AcademyMember)
