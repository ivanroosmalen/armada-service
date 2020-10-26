const MongooseService = require('./mongoose-service');
const { Class } = require('../models/models.js');
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

  async deleteByParentIdAndFutureDates(parentId) {
      if(!parentId) {
          throw new Error('Must pass in a parent id');
      }

    return this.schema.deleteMany({ parentId, 'schedule.startDate': { $gte: new Date() } });
  };

  async findByUserId(userId) {
      if(!userId) {
          throw new Error('Must pass in a userId');
      }

      return this.schema.find({
        '$or': [
          { 'instructors._id': userId },
          { 'attendees._id': userId }
        ]
      });
  };

  async updateUser(userId, fields) {
    let userFields = ['instructors', 'attendees']
    let classes = await this.findByUserId(userId);

    let updates = [];
    for(let classObj of classes) {
      for(let userField of userFields) {
        classObj[userField].forEach(user => {
          if(user.academyMember.member._id === userId) {
            Object.assign(user, fields)
            Object.assign(user.academyMember.member, fields)
          }
        })
      }

      updates.push(this.update(classObj._id, classObj));
    }

    await Promise.all(updates);
  }

  async count(query) {
    return this.schema.count(query);
  }
}

module.exports = new ClassService(Class)
