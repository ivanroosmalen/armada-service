const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
var s3 = new AWS.S3();

class AcademyRequestController extends BaseController {
    constructor(academyRequestService, userService, academyService) {
        super(academyRequestService);
        this.userService = userService;
        this.academyService = academyService;
    }

    async create(event) {
        if(!event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
            let user = await this.userService.findById(event.user._id);
            let academyRequest = event.body;

            academyRequest.user = {
              _id: user._id,
              alias: user.alias,
              firstName: user.firstName,
              lastName: user.lastName,
              thumbnailImg: user.thumbnailImg
            };

            academyRequest.complete = false;
            academyRequest.approved = false;

            entity = await this.service.create(academyRequest);
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

    async approve(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity;
        try {
            let id = event.pathParameters.id;
            let academies = await this.academyService.findByOwnerId(event.user._id);
            let academyRequest = await this.service.findById(id);
            let academy = academies.find(academy => (academy._id.toString() === academyRequest.toObject().academy._id.toString()));

            if(!academy) {
              return handleError(401, 'Unauthorized');
            }

            if(!event.body.hasOwnProperty('approved')) {
              return handleError(400, 'Unable to handle this request');
            }

            if(event.body.approved && academy.memberLimit === academy.students.length) {
              return handleError(403, 'Unable to handle this request');
            }

            academyRequest.approved = event.body.approved;
            academyRequest.complete = true;

            entity = await this.service.update(id, academyRequest);

            if(academyRequest.approved) {
              let student = academy.students.find(student => (student._id === academyRequest.user._id));
              if(!student) {
                let user = await this.userService.findById(academyRequest.user._id);
                let newStudent = {
                  _id: user._id,
                  alias: user.alias,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  thumbnailImg: user.thumbnailImg
                };
                academy.students = academy.students || [];
                academy.students.push(newStudent);
                await this.academyService.update(academy._id, academy);
              }
            }

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

    async list(event) {
        let params = this._getListQuery(event.queryStringParameters);

        let entities;
        try {
            let academies = await this.academyService.findByOwnerId(event.user._id);

            if(academies && academies.length) {
              let academyIds = academies.map(academy => academy._id);
              let query = {
                'academy._id': { $in : academyIds }
              }

              if(event.queryStringParameters && event.queryStringParameters.complete !== undefined && event.queryStringParameters.complete !== null) {
                query.complete = event.queryStringParameters.complete;
              }

              if(event.queryStringParameters && event.queryStringParameters.approved !== undefined && event.queryStringParameters.approved !== null) {
                query.approved = event.queryStringParameters.approved;
              }

              entities = await this.service.list(query, params);
            }

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

    async getByAcademyId(event) {
        if(!event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass a valid id');
        }

        let entity
        try {
            let id = event.pathParameters.id;
            let userId = event.user._id;

            let complete = event.queryStringParameters ? event.queryStringParameters.complete : undefined;
            let approved = event.queryStringParameters ? event.queryStringParameters.approved : undefined;

            entity = await this.service.findByAcademyIdAndUserId(id, userId, complete, approved);
        } catch(e) {
            return handleError(500, 'Unable to find entity', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Entity returned',
                entity
            })
        };
    }

}

module.exports = AcademyRequestController
