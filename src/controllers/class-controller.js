const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const moment = require('moment-timezone');
const settings = require('../settings.js');

class ClassController extends BaseController {
    constructor(classService, userService, academyService) {
        super(classService);

        this.userService = userService;
        this.academyService = academyService;
    }

    async list(event) {
        let queryParams = event.queryStringParameters;
        let params = this._getListQuery(queryParams);
        let academyId = queryParams.academyId;
        if(!academyId) {
          return handleError(400, 'Unable to get classes', e);
        }

        let entities = [];
        try {
            let query = {
              $or: [
                {
                  'schedule.startDate': { '$gte': moment(queryParams.startDate).toDate() },
                  'schedule.endDate': { '$lte': moment(queryParams.endDate).endOf('day').toDate() }
                },
                {
                  'schedule.recurring': true,
                  'schedule.endDate': { '$lte': moment(queryParams.endDate).endOf('day').toDate() }
                }
              ],
              academyId: { '$in': academyId.split(',') }
            };

            let classes = await this.service.list(query, params);
            if(classes && classes.length) {
              classes.forEach(classObj => {
                let entity = classObj.toObject();
                if(entity.schedule.recurring) {
                  let recurringClasses = this.getRecurringEntities(entity, moment(queryParams.startDate), moment(queryParams.endDate).endOf('day'), entity.schedule.interval, entity._id, entity.schedule.excludes);
                  entities.push.apply(entities, recurringClasses)
                } else {
                  entities.push(entity);
                }
              })
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

    groupCurrentUserAttendanceCountByWeek(classes, startDate, endDate, timezone) {
      if(!(classes && classes.length)) {
        return {};
      }

      let attendanceByWeek = {};

      startDate = startDate.startOf('week');
      for(startDate; startDate < endDate; startDate.add(1, 'weeks')) {
        attendanceByWeek[startDate.format('YYYY/MM/DD')] = 0;
      }

      classes.forEach(classObj => {
        let weekDate = moment(classObj.schedule.startDate).tz(timezone).startOf('week').format('YYYY/MM/DD');
        attendanceByWeek[weekDate] = attendanceByWeek.hasOwnProperty(weekDate) ? attendanceByWeek[weekDate] + 1 : 1;
      })

      return attendanceByWeek;
    }

    groupAllUserAttendanceCountByDay(classes, startDate, endDate, timezone) {
      if(!(classes && classes.length)) {
        return {};
      }

      let attendanceByDay = {};
      let total = 0;
      for(startDate; startDate < endDate; startDate.add(1, 'day')) {
        attendanceByDay[startDate.format('YYYY/MM/DD')] = 0;
      }

      classes.forEach(classObj => {
        total+= (classObj.attendees ? classObj.attendees.length : 0);
        let dayDate = moment(classObj.schedule.startDate).tz(timezone).format('YYYY/MM/DD');
        attendanceByDay[dayDate] = attendanceByDay.hasOwnProperty(dayDate) ? attendanceByDay[dayDate] + classObj.attendees.length : 0;
      })

      return [ total, attendanceByDay ];
    }

    async getAttendanceMetrics(event) {
        let queryParams = event.queryStringParameters;

        let timezone = queryParams.timezone || 'utc';
        let startDate = queryParams.startDate ? moment(queryParams.startDate) : moment().subtract(1, 'month');
        let endDate = queryParams.endDate ? moment(queryParams.endDate) : moment();

        let entities = { byWeek: {}, total: 0 };

        try {
            let query = {
              $and: [
                {'schedule.startDate': { '$lte': endDate }},
                {'schedule.startDate': { '$gte': startDate }},
                {'attendees._id': event.user._id}
              ]
            };

            let classes = await this.service.list(query);
            entities.byWeek = this.groupCurrentUserAttendanceCountByWeek(classes, startDate.tz(timezone), endDate.tz(timezone), timezone);
            entities.total = classes.length;
        } catch(e) {
            return handleError(500, 'Unable to find entities', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Entities listed',
                entity: entities || { byWeek: {}, total: 0 }
            })
        };
    };

    async getTotalAttendanceMetrics(event) {
        let queryParams = event.queryStringParameters;

        let timezone = queryParams.timezone || 'utc';
        let startDate = queryParams.startDate ? moment(queryParams.startDate) : moment().subtract(1, 'month');
        let endDate = queryParams.endDate ? moment(queryParams.endDate) : moment();

        let entities = { byWeek: {}, total: 0 };

        try {
            let academies = await this.academyService.findByOwnerId(event.user._id);
            if(!(academies && academies.length)) {
              return handleError(401, 'Unauthorized', e);
            }

            let query = {
              $and: [
                {'schedule.startDate': { '$lte': endDate }},
                {'schedule.startDate': { '$gte': startDate }},
                {academyId: { '$in': academies.map(academy => academy._id) }}
              ]
            };

            let classes = await this.service.list(query);
            let result = this.groupAllUserAttendanceCountByDay(classes, startDate.tz(timezone), endDate.tz(timezone), timezone);
            entities.total = result[0];
            entities.byWeek = result[1];
        } catch(e) {
            return handleError(500, 'Unable to find entities', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Entities listed',
                entity: entities || { byWeek: {}, total: 0 }
            })
        };
    };

    async create(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let classObj = event.body;
        let isAuthorized = await this.isAuthorizedByOwnership(classObj, event.user);
        if(!isAuthorized) {
          return handleError(401, 'Unauthorized');
        }

        let entity;
        try {
            if(classObj.parentId && classObj.excludeDate) {
                let currentClass = await this.service.findById(classObj.parentId);
                if(currentClass) {
                    currentClass.schedule.excludes.push(classObj.excludeDate);
                    await this.service.update(currentClass._id, currentClass);
                }
            }

            classObj.parentId = undefined;
            entity = await this.service.create(classObj);
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

        let classObj = event.body;
        let isAuthorized = await this.isAuthorizedByOwnership(classObj, event.user);
        if(!isAuthorized) {
          return handleError(401, 'Unauthorized');
        }

        let entity;
        try {
            let id = event.pathParameters.id;
            // Removing parent ID to have a completely separate event
            classObj.parentId = undefined;
            entity = await this.service.update(id, classObj);
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
        if(!event || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass a valid id');
        }

        let id = event.pathParameters.id;
        let classObj = await this.service.findById(id);
        if(!classObj) {
            throw new Error('Entity does not exist');
        }

        let isAuthorized = await this.isAuthorizedByOwnership(classObj, event.user);
        if(!isAuthorized) {
          return handleError(401, 'Unauthorized');
        }

        try {
            await Promise.all([
              this.service.deleteById(id),
              // this.service.deleteByParentIdAndFutureDates(id)
            ]);
        } catch(e) {
            return handleError(500, 'Unable to delete entity', e);
        }

        return {
            statusCode: 204,
            body: JSON.stringify({
                message: 'Entity deleted'
            })
        };
    };

    async attend(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let { classId, startDate, endDate, online } = event.body;
        let userId = event.user._id;

        if(!(userId && classId && startDate && endDate)) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
          let promise = await Promise.all([
            this.userService.findById(userId),
            this.service.findById(classId),
            this.service.findByParentIdAndStartDate(classId, startDate),
            this.academyService.getUserAcademies(userId)
          ])

          let user = promise[0];
          let classObj = promise[1];
          let existingClass = promise[2];
          let userAcademies = promise[3] || {};

          if(!(user && classObj)) {
            return handleError(400, 'You need to pass a valid object');
          }

          if(!(userAcademies.student && userAcademies.student.find(academy => (academy._id.toString() === classObj.academyId.toString())))) {
            return handleError(400, 'User is not an academy member');
          }

          if(classObj.classSize && classObj.classSize < classObj.attendees.length) {
            return handleError(400, 'Class limit is reached');
          }

          let classToUpdate;
          let exactClassExists = moment(classObj.schedule.startDate).valueOf() === moment(startDate).valueOf() || existingClass;
          if(exactClassExists) {
            classToUpdate = existingClass || classObj;
          } else {
            classToUpdate = await this.createNewClassFromExisting(classObj, startDate, endDate);
          }

          let attendee = {
            _id: user._id,
            alias: user.alias,
            firstName: user.firstName,
            lastName: user.lastName,
            thumbnailImg: user.thumbnailImg,
            online
          }

          let isAttending = classToUpdate.attendees && classToUpdate.attendees.find(attendee => (attendee._id.toString() === user._id.toString()));
          if(!isAttending) {
            classToUpdate.attendees = classToUpdate.attendees || [];
            classToUpdate.attendees.push(attendee);
            entity = await this.service.update(classToUpdate._id, classToUpdate);
          } else {
            entity = classToUpdate;
          }

        } catch(e) {
          return handleError(500, 'Unable to attend event', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User successfully attending',
                entity
            })
        };
    };

    async unattend(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let { classId } = event.body;
        let userId = event.user._id;

        let entity;
        try {
          let classObj = await this.service.findById(classId);
          classObj.attendees = classObj.attendees && classObj.attendees.filter(attendee => (attendee._id !== userId));
          entity = await this.service.update(classObj._id, classObj);
        } catch(e) {
          return handleError(500, 'Unable to unattend event', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User successfully unattending',
                entity
            })
        };
    };

    getRecurringEntities(entity, startDate, endDate, interval, parentId, excludes = []) {
      let entityStartDate = moment(entity.schedule.startDate)

      if(entityStartDate > endDate) {
        return [];
      }

      let entities = [ ];
      if(!excludes.find(excludeDate => moment(excludeDate).valueOf() === entityStartDate.valueOf()) && moment(startDate).valueOf() <= entityStartDate.valueOf()) {
        entities.push(entity);
      }

      let newEntity = JSON.parse(JSON.stringify(entity));

      switch(interval) {
        case 'daily':
          newEntity.schedule.startDate = moment(newEntity.schedule.startDate).add(1, 'days').toDate();
          newEntity.schedule.endDate = moment(newEntity.schedule.endDate).add(1, 'days').toDate();
        break;
        case 'weekly':
          newEntity.schedule.startDate = moment(newEntity.schedule.startDate).add(7, 'days').toDate();
          newEntity.schedule.endDate = moment(newEntity.schedule.endDate).add(7, 'days').toDate();
        break;
        case 'semiMonthly':
          newEntity.schedule.startDate = moment(newEntity.schedule.startDate).add(14, 'days').toDate();
          newEntity.schedule.endDate = moment(newEntity.schedule.endDate).add(14, 'days').toDate();
        break;
        case 'monthly':
          newEntity.schedule.startDate = moment(newEntity.schedule.startDate).add(31, 'days').toDate();
          newEntity.schedule.endDate = moment(newEntity.schedule.endDate).add(31, 'days').toDate();
        break;
      }

      newEntity.parentId = parentId;
      newEntity.schedule.recurring = false;
      newEntity.schedule.interval = undefined;
      newEntity.schedule.excludes = [];
      newEntity.attendees = [];

      let newEntities = this.getRecurringEntities(newEntity, startDate, endDate, interval, parentId, excludes)
      entities.push.apply(entities, newEntities);
      return entities;
    }

    async createNewClassFromExisting(classObj, startDate, endDate) {
      // Need to create new class and schedule item, so add excluding date to parent
      classObj.schedule.excludes = classObj.schedule.excludes || [];
      classObj.schedule.excludes.push(startDate);
      await this.service.update(classObj._id, classObj);

      let newClassObj = {schedule: {}};
      Object.assign(newClassObj, classObj.toObject())

      newClassObj.parentId = newClassObj._id;
      newClassObj._id = undefined;
      newClassObj.schedule.startDate = startDate;
      newClassObj.schedule.endDate = endDate;
      newClassObj.schedule.recurring = false;
      newClassObj.schedule.interval = undefined;
      newClassObj.schedule.excludes = undefined;

      return this.service.create(newClassObj);
    }

    async isAuthorizedByOwnership(classObj, user) {
        let academy = await this.academyService.findById(classObj.academyId);
        return ((academy.owners && academy.owners.find(owner => (owner._id.toString() === user._id.toString()))) || user.admin === true)
    }
}

module.exports = ClassController
