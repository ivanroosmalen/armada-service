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

        let academyId = event.queryStringParameters.academyId
        let entities;
        try {
            entities = await this.service.list({'academy._id': academyId}, params)
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

    async removeAcademyMember(event) {
      if(!event.pathParameters || !event.pathParameters.id) {
          return handleError(400, 'You need to pass entity info to update an entity');
      }

      let academy;
      let academyMember
      let { id } = event.pathParameters;
      try {
          academyMember = await this.service.findById(id);
          academy = await this.academyService.findById(academyMember.academy._id);
      } catch(e) {
          return handleError(500, 'Unable to find entity', e);
      }

      let index;
      let student = academy.students.find((student, i) => {
        if(student._id === event.user._id) {
          index = i;

          return true;
        }
      });

      if(!student) {
          return handleError(401, 'Unauthorized');
      }

      try {
          academy.students.splice(index, 1);

          let promises = await Promise.all([
            this.academyService.update(academy._id, academy),
            this.service.deleteById(academyMember._id)
          ])
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
