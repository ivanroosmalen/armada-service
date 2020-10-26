const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
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
