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
    constructor(userService, tokenService, academyService, classService) {
        super(userService);

        this.tokenService = tokenService;
        this.academyService = academyService;
        this.classService = classService;
    }

    cleanseUserResponse(user) {
        user.password = undefined;
        user.jwt = undefined;
        user.jwtExpiration = undefined;
        user.admin = undefined;
        user.emailVerificationToken = undefined;
        user.emailExpiration = undefined;
        user.verified = undefined;

        return user;
    }

    cleanseUserPreSave(user) {
        user.jwt = undefined;
        user.jwtExpiration = undefined;
        user.admin = undefined;
        user.emailVerificationToken = undefined;
        user.emailExpiration = undefined;
        user.verified = undefined;

        return user;
    }

    async create(event) {
      if(event.user.admin !== true) {
          return handleError(400, 'Unauthorized');
      }

      super.create();
    };

    async batchCreate(event) {
      if(event.user.admin !== true) {
          return handleError(400, 'Unauthorized');
      }

      super.batchCreate();
    };

    async delete(event) {
        if(!event.user.admin) {
          return handleError(400, 'Unauthorized');
        }

        super.delete(event);
    };

    async update(event) {
      if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
          return handleError(400, 'You need to pass entity info to update an entity');
      }

      if(event.user._id !== event.user._id && !event.user.admin === true) {
          return handleError(400, 'Unauthorized');
      }

      let entity;
      try {
          let id = event.pathParameters.id;

          let dependentFields = {}
          if(event.body.alias) dependentFields.alias = event.body.alias;
          if(event.body.firstName) dependentFields.firstName = event.body.firstName;
          if(event.body.lastName) dependentFields.lastName = event.body.lastName;

          let updates = [
            this.service.update(id, this.cleanseUserPreSave(event.body)),
            this.academyService.updateAcademyUser(id, dependentFields),
            this.classService.updateClassUser(id, dependentFields),
          ];

          let promises = await Promise.all(updates);
          entity = promises[0];
      } catch(e) {
          return handleError(500, 'Unable to update entity', e);
      }

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Entity updated',
              entity: this.cleanseUserResponse(entity)
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
            entity.user = this.cleanseUserResponse(user);
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
        if(!event || !event.body || !event.body.email) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        let body = event.body;
        try {
            let user = await this.service.findOneByParams({ email: body.email });
            if(user) {
                return handleError(500, 'User with this email already exists');
            }

            body.emailVerificationToken = uuidv4();
            body.emailExpiration = moment().add(1, 'hours');
            body.verified = false;
            body.admin = false

            let newPassword = Math.floor(1000 + Math.random() * 9000);
            body.password = bcrypt.hashSync(newPassword.toString(), settings.auth.saltRounds);

            entity = await this.service.create(body);
            await emailService.sendRegistrationEmail(body.email, newPassword);
        } catch(e) {
            return handleError(500, 'Unable to register', e);
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Entity created',
                entity: this.cleanseUserResponse(entity)
            })
        };
    };

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
        if(!event || !event.body || !event.body.newPassword || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'Cannot send email');
        }

        let id = event.pathParameters.id;
        let { newPassword, oldPassword } = event.body;

        if(event.user._id !== id && !event.user.admin) {
            return handleError(401, 'Unauthorized');
        }

        let user = await this.service.findById(id, true);
        if(!event.user.admin) {
            let oldPasswordCorrect = await bcrypt.compareSync(oldPassword, user.password);

            if(!oldPasswordCorrect) {
                return handleError(400, 'Previous password is incorrect');
            }
        }

        user.password = await bcrypt.hashSync(newPassword, settings.auth.saltRounds);
        let res = await this.service.update(id, user);

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
          let updates = [];
          let s3Params = {
              Bucket: 'armada-user-images',
              Key: `${id}/${type}/${uuidv4()}`,
              ContentType: event.body.contentType,
              ACL: 'public-read'
          };
          uploadURL = await s3.getSignedUrl('putObject', s3Params);

          if(type === 'profile') {
              entity.profileImg = uploadURL.split('?')[0];
          } else if(type === 'thumbnail') {
              entity.thumbnailImg = uploadURL.split('?')[0];

              updates = [
                this.academyService.updateAcademyUser(id, { thumbnailImg: entity.thumbnailImg }),
                this.classService.updateClassUser(id, { thumbnailImg: entity.thumbnailImg })
              ];
          }

          updates.push(this.service.update(id, entity));
          await Promise.all(updates);
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
