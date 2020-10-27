const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
var s3 = new AWS.S3();

class AcademyController extends BaseController {
    constructor(academyService, academyMemberService, userService, locationService) {
        super(academyService);
        this.academyMemberService = academyMemberService;
        this.userService = userService;
        this.locationService = locationService;
    }

    async getUserAcademies(event) {
      let { id } = event.pathParameters;

      let entity = {};
      try {
          let memberships = await this.academyMemberService.list({'member._id': id});
          let academyIds = memberships.map(membership => membership.academy._id);

          let promises = await Promise.all([
            this.service.list({ _id: { $in: academyIds } }),
            this.academyMemberService.countsByAcademyIds(academyIds)
          ])

          let academies = promises[0];
          let countByAcademy = promises[1];

          academies = academies.map(academy => {
            academy = academy.toObject();
            academy.memberCount = countByAcademy[academy._id.toString()]
            return academy;
          })

          let ownerAcademyIds = memberships.filter(member => member.isOwner).map(member => member.academy._id.toString());
          let ownerAcademies = academies.filter(academy => (ownerAcademyIds.indexOf(academy._id.toString()) !== -1))

          let instructorAcademyIds = memberships.filter(member => member.isInstructor).map(member => member.academy._id.toString());
          let instructorAcademies = academies.filter(academy => (instructorAcademyIds.indexOf(academy._id.toString()) !== -1))

          entity.owner = ownerAcademies;
          entity.instructor = instructorAcademies;
          entity.student = academies;

      } catch(e) {
          return handleError(500, 'Unable to find entities', e);
      }

      return {
          statusCode: 200,
          body: JSON.stringify({
              message: 'Entities listed',
              entity: entity || {}
          })
      };
    };

    async list(event) {
        let params = this._getListQuery(event.queryStringParameters);

        let { latMin, latMax, lngMin, lngMax, currentLat, currentLng } = event.queryStringParameters || {};
        let query = {};
        if(latMin && latMax && lngMin && lngMax) {
            let entityType = 'academy';
            let locations = await this.locationService.listByWindow(parseFloat(latMin), parseFloat(latMax), parseFloat(lngMin), parseFloat(lngMax), entityType);
            query['_id'] = { $in: locations.map(location => location.entityId)}
        } else if(currentLat && currentLng) {
            let entityType = 'academy';
            let locations = await this.locationService.listByUserLocation(parseFloat(currentLat), parseFloat(currentLng), entityType);
            query['_id'] = { $in: locations.map(location => location.entityId)}
        }

        let entities;
        try {
            entities = await this.service.list(query, params);
            let academyIds = entities.map(academy => academy._id);
            let countByAcademy = await this.academyMemberService.countsByAcademyIds(academyIds);
            entities = entities.map(entity => {
              let academy = entity.toObject();
              academy.memberCount = countByAcademy[academy._id.toString()]
              return academy;
            })
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

    async get(event) {
        if(!event || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass a valid id');
        }

        let entity
        try {
            let id = event.pathParameters.id;
            let promises = await Promise.all([
              this.service.findById(id),
              this.academyMemberService.countsByAcademyIds([id])
            ])

            entity = promises[0];
            let countByAcademy = promises[1];
            entity = entity.toObject();
            entity.memberCount = countByAcademy[id];
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
    };

    async create(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let academy = event.body;
        let entity;
        try {
            let user = await this.userService.findById(event.user._id);
            if(!user) {
                return handleError(401, 'Unauthorized', e);
            }

            let condensedUser = this.userService.getCondensedUser(user);
            academy.owners = [condensedUser];
            academy.students = [condensedUser];
            academy.memberLimit = settings.membership.defaultMemberLimit;

            entity = await this.service.create(academy);

            let academyMember = {
              member: condensedUser,
              academy: {
                _id: entity.toObject()._id,
                name: entity.toObject().name
              },
              isOwner: true,
              isManager: true
            }

            await this.academyMemberService.create(academyMember);

            let locations = [];
            entity.toObject().locations && entity.toObject().locations.forEach(loc => {
                let location = Object.assign({}, loc);
                location.entityType = 'academy';
                location.entityId = entity._id;
                location.type = 'Point';
                locations.push(location);
            })

            if(locations && locations.length) {
                await this.locationService.batchCreate(locations);
            }
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
        let { id } = event.pathParameters;
        try {
            entity = await this.service.findById(id);
        } catch(e) {
            return handleError(500, 'Unable to find entity', e);
        }

        if(!entity.owners.find(owner => owner._id === event.user._id) && !event.user.admin) {
            return handleError(401, 'Unauthorized');
        }

        try {
            entity = await this.service.update(id, event.body);

            await this.locationService.deleteByEntityId(entity._id);

            let locations = [];
            event.body.locations && event.body.locations.forEach(loc => {
                let location = Object.assign({}, loc);
                location.entityType = 'academy';
                location.entityId = entity._id;
                locations.push(location);
            })

            if(locations && locations.length) {
                await this.locationService.batchCreate(locations);
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

    async delete(event) {
        if(event.user.admin !== true) {
          return handleError(400, 'Unauthorized');
        }

        super.delete(event);
    };

    async uploadImage(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity
        let ownerMembership
        let { id, type } = event.pathParameters;
        try {
            let promises = await Promise.all([
              this.service.findById(id),
              this.academyMemberService.findOne({ 'member._id': event.user._id, 'academy._id': id, isOwner: true })
            ])
            entity = promises[0];
            ownerMembership = promises[1];

            if(!ownerMembership && !event.user.admin) {
                return handleError(401, 'Unauthorized');
            }
        } catch(e) {
            return handleError(500, 'Unable to find entity', e);
        }

        let uploadURL = ''
        try {
          let s3Params = {
              Bucket: 'armada-academy-images',
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


    //DEPRECATED
    async cancelMembership(event) {
      if(!event.pathParameters || !event.pathParameters.id) {
          return handleError(400, 'You need to pass entity info to update an entity');
      }

      let entity;
      let academyMember;
      let { id } = event.pathParameters;
      try {
          entity = await this.service.findById(id);
          academyMember = await this.academyMemberService.findOne({ 'member._id': event.user._id, 'academy._id': id });
      } catch(e) {
          return handleError(500, 'Unable to find entity', e);
      }

      let index;
      let student = entity.students.find((student, i) => {
        if(student._id === event.user._id) {
          index = i;

          return true;
        }
      });

      if(!student) {
          return handleError(401, 'Unauthorized');
      }

      try {
          entity.students.splice(index, 1);
          entity = await this.service.update(id, entity);
          await this.academyMemberService.deleteById(academyMember._id)
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
    }
}

module.exports = AcademyController
