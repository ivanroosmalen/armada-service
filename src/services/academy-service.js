const MongooseService = require('./mongoose-service');
const settings = require('../settings');

class AcademyService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async findByUserId(userId) {
      if(!userId) {
          throw new Error('Must pass in a userId');
      }

      return this.schema.find({
        '$or': [
          { 'owners._id': userId },
          { 'instructors._id': userId },
          { 'students._id': userId }
        ]
      });
  };

  async findByOwnerId(userId) {
      if(!userId) {
          throw new Error('Must pass in a userId');
      }

      return this.schema.find({ 'owners._id': userId });
  };

  async updateAcademyUser(userId, fields) {
    let userFields = ['owners', 'instructors', 'students']
    let academies = await this.findByUserId(userId);

    let updates = [];
    for(let academy of academies) {
      for(let userField of userFields) {
        academy[userField].forEach(user => {
          if(user._id === userId) {
            Object.assign(user, fields)
          }
        })
      }

      updates.push(this.update(academy._id, academy));
    }

    await Promise.all(updates);
  }

}

module.exports = AcademyService
