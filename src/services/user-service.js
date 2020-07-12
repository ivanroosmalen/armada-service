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
      let pw = entity.password
      entity.password = bcrypt.hashSync(entity.password, settings.auth.saltRounds);

      let user = await this.schema.create(entity);
      delete user.password;

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

  async list(query) {
      return this.schema.find({}, { password:0, jwt: 0, jwtExpiration: 0 }, query);
  };

  async login(email, password) {
      let user = await this.schema.findOne({email: email});
      if(!user) {
          throw new Error('Bad credentials');
      }

      let loggedIn = bcrypt.compareSync(password, user.password);

      if(!loggedIn) {
          throw new Error('Bad credentials');
      }

      delete user.password;
      return user;
  };

  async getByJwt(jwt) {
      if(!jwt) {
          throw new Error('Cannot find an entity without a token');
      }

      let user = await this.schema.findOne({ jwt: jwt });
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
