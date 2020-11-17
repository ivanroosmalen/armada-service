const BaseController = require('./base-controller.js');
const emailService = require('../services/email-service.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
var s3 = new AWS.S3();

class AcademyMemberController extends BaseController {
    constructor(academyMemberService, academyRequestService, userService, academyService) {
        super(academyMemberService);
        this.academyRequestService = academyRequestService;
        this.userService = userService;
        this.academyService = academyService;
    }

    async list(event) {
        let params = this._getListQuery(event.queryStringParameters);

        if(!(event.queryStringParameters && event.queryStringParameters.academyId)) {
            return handleError(400, 'You need to pass a valid academyId');
        }

        let query = {
          'academy._id': event.queryStringParameters.academyId
        }

        if(event.queryStringParameters.memberId) {
          query['member._id'] = event.queryStringParameters.memberId;
        }

        let entities;
        try {
            entities = await this.service.list(query, params)
        } catch(e) {
            return handleError(500, 'Unable to find entities', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Entities listed',
                entity: entities || []
            })
        };
    };

    async create(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let body = event.body;

        let entity;
        try {
            let promises = await Promise.all([
              this.academyService.findById(body.academy._id),
              this.service.findOne({ 'member._id': event.user._id, 'academy._id': body.academy._id, 'isOwner': true }),
              this.service.count({ 'academy._id': body.academy._id })
            ]);

            let academy = promises[0];
            let isOwner = promises[1];
            let memberCount = promises[2] || 0;

            if(!isOwner) {
                return handleError(401, 'Unauthorized');
            }

            if(memberCount >= academy.memberLimit) {
              return handleError(403, 'Member limit reached');
            }

            body.academy.name = academy.name;

            if(academy.martialArts && academy.martialArts.length === 1) {
              body.martialArts = [ academy.martialArts[0].name ];
            }

            entity = await this.service.create(body);
        } catch(e) {
            return handleError(500, 'Unable to create entity', e);
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Entity created',
                entity
            })
        };
    };


    async update(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity;
        try {
            let id = event.pathParameters.id;
            let academyMember = await this.service.findById(id);
            let isOwner = await this.service.findOne({ 'member._id': event.user._id, 'academy._id': academyMember.academy._id, 'isOwner': true });
            if(!isOwner) {
                return handleError(401, 'Unauthorized');
            }

            entity = await this.service.update(id, event.body);
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

    async linkUser(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let body = event.body;

        let entity;
        try {
            let id = event.pathParameters.id;
            let promises = await Promise.all([
              this.service.findById(id),
              this.userService.findOneByParams({ email: body.email })
            ])
            let academyMember = promises[0];
            let user = promises[1];

            promises = await Promise.all([
              this.service.findOne({ 'member._id': event.user._id, 'academy._id': academyMember.academy._id, 'isOwner': true }),
              this.service.findOne({ 'member._id': user._id, academy: academyMember.academy._id })
            ])

            let isOwner = promises[0];
            if(!isOwner) {
                return handleError(401, 'Unauthorized');
            }

            let existingMember = promises[1];
            if(existingMember) {
              return handleError(403, 'User already exists as a member');
            }

            if(user) {
                academyMember.member = this.userService.getCondensedUser(user);
                entity = await this.service.update(id, academyMember);

                await emailService.sendJoinFromAcademyEmail([body.email], {academy: academyMember.academy}, body.locale);
                return {
                    statusCode: 201,
                    body: JSON.stringify({
                        message: 'User linked',
                        entity:{}
                    })
                };
            }

            body.emailVerificationToken = uuidv4();
            body.emailExpiration = moment().add(1, 'hours');
            body.verified = false;
            body.admin = false

            let newPassword = Math.floor(1000 + Math.random() * 9000);
            body.password = bcrypt.hashSync(newPassword.toString(), settings.auth.saltRounds);

            user = await this.userService.create(body);

            academyMember.member = this.userService.getCondensedUser(user);
            entity = await this.service.update(id, academyMember);

            await emailService.sendRegistrationFromAcademyEmail([body.email], {newPassword, academy: academyMember.academy}, body.locale);
        } catch(e) {
            return handleError(500, 'Unable to update entity', e);
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'User linked',
                entity
            })
        };
    };

    async delete(event) {
      if(!event.pathParameters || !event.pathParameters.id) {
          return handleError(400, 'You need to pass entity info to update an entity');
      }

      let academyMember;
      let isOwner;
      let { id } = event.pathParameters;
      try {
          academyMember = await this.service.findById(id);
          isOwner = await this.service.findOne({ 'member._id': event.user._id, 'academy._id': academyMember.academy._id, 'isOwner': true });
      } catch(e) {
          return handleError(500, 'Unable to find entity', e);
      }

      let isRequestedMember = academyMember.member._id === event.user._id;

      if(!isOwner && !isRequestedMember) {
          return handleError(401, 'Unauthorized');
      }

      try {
          await this.service.deleteById(academyMember._id)
      } catch(e) {
          return handleError(500, 'Unable to update entity', e);
      }

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Academy member removed',
          })
      };
    }

}

module.exports = AcademyMemberController
