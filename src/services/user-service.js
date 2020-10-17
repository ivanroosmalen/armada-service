const bcrypt = require('bcryptjs');
const MongooseService = require('./mongoose-service');
const { User } = require('../models/models.js');
const settings = require('../settings');

class UserService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  getExceptions() {
      return {
         password:0,
         jwt: 0,
         jwtExpiration: 0,
         admin: 0,
         email: 0,
         emailVerificationToken: 0,
         emailExpiration: 0,
         verified: 0,
         forgotPassword: 0
      };
  }

  async create(entity) {
      if(!entity) {
          throw new Error('Cannot create invalid entity');
      }
      entity.admin = false;

      let user = await this.schema.create(entity);
      delete user.password;
      delete user.admin;
      delete user.jwt;
      delete user.jwtExpiration;
      delete user.emailVerificationToken;
      delete user.emailExpiration;
      delete user.verified;
      delete user.forgotPassword;
      delete user.stripeCustomerId;

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

      let user = await this.schema.findByIdAndUpdate(id, entity, {new: true});
      user.password = undefined;
      user.stripeCustomerId = undefined;
      return user;
  };

  async findById(id, complete = false) {
      if(!id) {
          throw new Error('Cannot find an entity without an id');
      }

      return this.schema.findById(id, complete ? {} : this.getExceptions());
  };

  async findOneByParams(query) {
      return this.schema.findOne(query);
  };

  async list(query, params, complete = false) {
      return this.schema.find(query, complete ? {} : this.getExceptions(), params);
  };

  async listPrivate(query, params) {
      return this.schema.find(query, {}, params);
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

  async getJwtToken(id) {
      if(!id) {
          throw new Error('Cannot find an entity without an id');
      }

      let user = await this.schema.findById(id, { jwt: 1 });
      return user.jwt;
  };

  getCondensedUser(user) {
    return {
      _id: user._id,
      alias: user.alias,
      firstName: user.firstName,
      lastName: user.lastName,
      thumbnailImg: user.thumbnailImg
    };
  }
}

module.exports = new UserService(User)
