const BaseController = require('./base-controller.js');
const emailService = require('../services/email-service.js');
const authUtils = require('../utils/auth-utils.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const moment = require('moment');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
var s3 = new AWS.S3();

class UserController extends BaseController {
    constructor(userService, tokenService) {
        super(userService);

        this.tokenService = tokenService;
    }

    cleanseUser(user) {
        user.password = undefined;
        user.jwt = undefined;
        user.jwtExpiration = undefined;
        user.admin = undefined;
        user.emailVerificationToken = undefined;
        user.emailExpiration = undefined;
        user.verified = undefined;

        return user;
    }

    cleanseUserUpdate(user) {
        user.jwt = undefined;
        user.jwtExpiration = undefined;
        user.admin = undefined;
        user.emailVerificationToken = undefined;
        user.emailExpiration = undefined;
        user.verified = undefined;

        return user;
    }

    async create(event) {};

    async batchCreate(event) {};

    async update(event) {
      if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
          return handleError(400, 'You need to pass entity info to update an entity');
      }

      if(event.user._id !== event.user._id) {
          return handleError(400, 'Unauthorized');
      }

      let entity;
      try {
          let id = event.pathParameters.id;
          entity = await this.service.update(id, cleanseUserUpdate(event.body));
      } catch(e) {
          return handleError(500, 'Unable to update entity', e);
      }

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Entity updated',
              entity
          })
      };
    };

    async login(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity = {};
        try {
            let user = await this.service.login(event.body.email, event.body.password);
            entity.jwt = await this.generateJWT(user);
            entity.user = this.cleanseUser(user);
        } catch(e) {
            return handleError(400, 'Unable to login', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Logged in',
                entity: entity
            })
        };
    };

    async logout(event) {
        let token = authUtils.getBearerToken(event.headers);
        if (!token) {
            return;
        }

        let decoded = this.tokenService.decode(token);
        await this.tokenService.removeByJwt(decoded.user.jwt);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Logged out',
                entity: {}
            })
        };
    };

    async register(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
            let body = event.body;
            body.emailVerificationToken = uuidv4();
            body.emailExpiration = moment().add(1, 'hours');
            body.verified = false;
            entity = await this.service.create(event.body);
        } catch(e) {
            return handleError(500, 'Unable to create entity', e);
        }

        //TODO determine app url
        emailService.sendRegistrationEmail(event.body.email);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Entity created',
                entity: cleanseUser(entity)
            })
        };
    };

    async verify(event) {
        if(!event || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'Cannot verify this account');
        }


        let user = this.service.findOneByParams({ emailVerificationToken: event.pathParameters.id });

        if(user.verified) {
            return handleError(400, 'User is already verified');
        }

        if(moment(user.emailExpiration) < moment()) {
            return handleError(400, 'Verification token has expired');
        }

        user.verified = true;

        let user = await this.service.update(user._id, user);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User verified',
                entity: cleanseUser(user)
            })
        };
    }

    async resendVerification(event) {
        if(!event || !event.body || !event.body.email) {
            return handleError(400, 'Cannot send email');
        }

        let user = this.service.findOneByParams({ email: event.body.email });

        if(user.verified) {
          return handleError(400, 'User is already verified');
        }

        user.emailVerificationToken = uuidv4();
        user.emailExpiration = moment().add(1, 'hours');
        user.verified = false;

        this.service.update(user._id, user);
        emailService.sendRegistrationEmail(user.email, user.emailVerificationToken);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Resent verification token',
                entity: {}
            })
        };
    }

    async forgotPassword(event) {
        if(!event || !event.body || !event.body.email) {
            return handleError(400, 'Cannot send email');
        }

        let user = await this.service.findOneByParams({ email: event.body.email });
        let newPassword = Math.floor(1000 + Math.random() * 9000);
        user.password = bcrypt.hashSync(newPassword.toString(), settings.auth.saltRounds);

        await this.service.update(user._id, user);
        await emailService.sendForgotPasswordEmail(user.email, newPassword);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'New password sent',
                entity: {}
            })
        };
    }

    async updatePassword(event) {
        if(!event || !event.body || !event.body.oldPassword || !event.body.newPassword || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'Cannot send email');
        }

        if(event.user._id !== event.pathParameters.id) {
            return handleError(401, 'Unauthorized');
        }

        let user = await this.service.findById(event.pathParameters.id);

        let oldPasswordCorrect = bcrypt.compareSync(event.body.oldPassword, user.password);
        if(!oldPasswordCorrect) {
            return handleError(400, 'Previous password is incorrect');
        }

        user.password = bcrypt.hashSync(event.body.newPassword, settings.auth.saltRounds);
        await this.service.update(user._id, user);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Password updated',
                entity: {}
            })
        };
    }

    async generateJWT(user) {
        let secret = this.tokenService.createSecret();
        let jwt = '';
        let payload = {
            user: user
        };

        try {
            user.jwt = this.tokenService.getSecretSuffix(secret);
            user.jwtExpiration = moment().add(settings.jwt.exp);

            let jwtToken = {
                user_id: user._id,
                suffix: user.jwt
            };
            await this.tokenService.create(jwtToken);
            jwt = this.tokenService.sign(payload, secret, settings.jwt.exp);
        } catch (e) {
            console.error(e);
        }
        return jwt;
    }

    async uploadImage(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity
        let { id, type } = event.pathParameters;
        try {
            entity = await this.service.findById(id);
        } catch(e) {
            return handleError(500, 'Unable to find entity', e);
        }

        let uploadURL = ''
        try {
          let s3Params = {
              Bucket: 'armada-user-images',
              Key: `${id}/${type}/${uuidv4()}` ,
              ContentType: event.body.contentType,
              ACL: 'public-read'
          };
          uploadURL = await s3.getSignedUrl('putObject', s3Params);

          if(type === 'profile') {
              entity.profileImg = uploadURL.split('?')[0];
          } else if(type === 'thumbnail') {
              entity.thumbnailImg = uploadURL.split('?')[0];
          }

          await this.service.update(id, entity);
        } catch(e) {
          return handleError(500, 'Unable to get image URL', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Entity created',
                entity: uploadURL
            })
        };
    }
}

module.exports = UserController
