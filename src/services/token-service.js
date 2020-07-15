const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');
const settings = require('../settings');
const MongooseService = require('./mongoose-service');

class TokenService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  createSecret() {
      return `${settings.jwt.secret}${settings.jwt.delimiter}${uuid()}`;
  };

  getSecret(suffix) {
      return `${settings.jwt.secret}${settings.jwt.delimiter}${suffix}`;
  };

  getSecretSuffix(secret) {
      return secret.split(settings.jwt.delimiter)[1];
  };

  createJti() {
      return `${uuid()}`
  };

  sign(payload, secret, expiresIn=settings.jwt.exp) {
      return jwt.sign(payload, new Buffer(secret, 'base64'), {expiresIn: expiresIn})
  };

  verify(token, secret) {
      try {
          return jwt.verify(token, new Buffer(secret, 'base64'));
      } catch (e) {
          if (e instanceof jwt.TokenExpiredError || e instanceof jwt.JsonWebTokenError) {
              throw new Error(e.message);
          } else  {
            throw new Error('unknown');
          }
      }
  };

  decode(token, complete=false) {
      return jwt.decode(token, {complete: complete})
  };

  async getByJwt(suffix) {
      if(!suffix) {
          throw new Error('Cannot find an entity without a token');
      }

      return this.schema.findOne({ suffix });
  };

  async removeByJwt(suffix) {
      if(!suffix) {
          throw new Error('We are having trouble logging you out');
      }

      return this.schema.deleteOne({ suffix });
  };

}

module.exports = TokenService;
