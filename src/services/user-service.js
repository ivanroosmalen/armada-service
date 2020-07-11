const bcrypt = require('bcrypt');
const MongooseService = require('./mongoose-service');
const settings = require('../settings');

class UserService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async create(entity) {
      if(!entity) {
          throw new Error('Cannot create invalid entity');
      }

      entity.password = bcrypt.hashSync(entity.password, settings.auth.saltRounds);

      let user = await this.schema.create(entity);
      delete user.password;
      console.log("user %j", user.password)
      return user;
  };

  async update(id, entity) {
      if(!id) {
          throw new Error('Cannot update a entity without an id');
      }

      if(!entity) {
          throw new Error('Cannot create invalid entity');
      }

      entity.lastUpdatedDate = new Date();

      let user = this.schema.findByIdAndUpdate(id, entity, {new: true});
      user.password = undefined;
      return user;
  };

  async findById(id) {
      if(!id) {
          throw new Error('Cannot find an entity without an id');
      }

      let user = this.schema.findById(id, { password:0, jwt: 0, jwtExpiration: 0 });
      return user;
  };

  async list(id) {
      return this.schema.find({}, { password:0, jwt: 0, jwtExpiration: 0 });
  };

  async login(email, password) {
      let user = await this.schema.find({email: email});
      if(!user && !user.length) {
          throw new Error('Bad credentials');
      }

      let loggedIn = await bcrypt.compare(password, user[0].password);

      if(!loggedIn) {
          return null;
      }

      return user[0];
  };

  async getByJwt(jwt) {
      if(!jwt) {
          throw new Error('Cannot find an entity without a token');
      }

      let user = this.schema.find({ jwt: jwt });
      return user.jwt;
  };

  async getJwtToken(id) {
      if(!id) {
          throw new Error('Cannot find an entity without an id');
      }

      let user = this.schema.findById(id, { jwt: 1 });
      return user.jwt;
  };

}

module.exports = UserService
