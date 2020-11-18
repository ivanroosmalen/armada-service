const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const moment = require('moment-timezone');
const settings = require('../settings.js');
const { safeAddDays } = require('../utils/datetime-utils.js');

class ClassController extends BaseController {
    constructor(classService, userService, academyService, academyMemberService) {
        super(classService);

        this.userService = userService;
        this.academyService = academyService;
        this.academyMemberService = academyMemberService;
    }

    async list(event) {
        let queryParams = event.queryStringParameters;
        let params = this._getListQuery(queryParams);
        let timezone = queryParams.timezone || 'America/Los_Angeles';
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
                  let recurringClasses = this.getRecurringEntities(entity, moment(queryParams.startDate).tz(timezone), moment(queryParams.endDate).tz(timezone).endOf('day'), entity.schedule.interval, entity._id, entity.schedule.excludes, timezone);
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
                {'schedule.startDate': { '$gte': startDate }}
              ]
            };

            if(queryParams.academyId) {
              query['$and'].push({ academyId: queryParams.academyId })
            }

            if(queryParams.memberId) {
              query['$and'].push({'attendees.academyMember._id': queryParams.memberId})
            } else {
              query['$and'].push({
                $or: [
                  {'attendees._id': event.user._id}, // deprecated
                  {'attendees.academyMember.member._id': event.user._id}
                ]
              })
            }

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
        let academyId = queryParams.academyId;

        let entities = { byWeek: {}, total: 0 };
        let memberQuery = { 'member._id': event.user._id, isOwner: true };
        if(academyId) memberQuery['academy._id'] = academyId

        try {
            let ownerMemberships = await this.academyMemberService.list(memberQuery)
            if(!(ownerMemberships && ownerMemberships.length)) {
              return handleError(401, 'Unauthorized', e);
            }

            let query = {
              $and: [
                {'schedule.startDate': { '$lte': endDate }},
                {'schedule.startDate': { '$gte': startDate }},
                {academyId: { '$in': ownerMemberships.map(member => member.academy._id) }}
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

        let { classId, startDate, endDate, online, timezone } = event.body;
        timezone = timezone || 'America/Los_Angeles';
        let userId = event.user._id;

        if(!(userId && classId && startDate && endDate)) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
          let promise = await Promise.all([
            this.service.findById(classId),
            this.service.findByParentIdAndStartDate(classId, startDate)
          ])

          let classObj = promise[0];
          let existingClass = promise[1];

          let academyMember = await this.academyMemberService.findOne({'member._id': userId, 'academy._id': classObj.academyId.toString()});

          if(!(academyMember && classObj)) {
            return handleError(400, 'You need to pass a valid object');
          }

          if(!online) {
            let inPersonAttendees = classObj.attendees.filter(attendee => !attendee.online);
            if(classObj.classSize && classObj.classSize <= inPersonAttendees.length) {
              return handleError(400, 'Class limit is reached');
            }
          } else {
            let onlineAttendees = classObj.attendees.filter(attendee => attendee.online);
            if(classObj.supportOnlineClasses && classObj.onlineClassSize && classObj.onlineClassSize <= onlineAttendees.length) {
              return handleError(400, 'Class limit is reached');
            }
          }

          let classToUpdate;
          let exactClassExists = !classObj.schedule.recurring || moment(classObj.schedule.startDate).valueOf() === moment(startDate).valueOf() || existingClass;
          if(exactClassExists) {
            classToUpdate = existingClass || classObj;
          } else {
            // if startDate is not multiple of original class date -> throw error
            let isValid = this.validateWithRecurringClass(classObj.schedule.interval, classObj.schedule.startDate, startDate);
            if(!isValid) {
              return handleError(400, 'startDate does not match recurring class');
            }

            classToUpdate = await this.createNewClassFromExisting(classObj, startDate, endDate, timezone);
          }

          let attendee = {};
          Object.assign(attendee, academyMember.member);
          attendee.online = online;
          attendee.academyMember = academyMember;

          let isAttending = classToUpdate.attendees && classToUpdate.attendees.find(attendee => (attendee.academyMember._id.toString() === academyMember._id.toString()));
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
          classObj.attendees = classObj.attendees && classObj.attendees.filter(attendee => (attendee.academyMember.member._id !== userId));
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

    async batchAttend(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let { classId, startDate, endDate, attendees, timezone } = event.body;
        timezone = timezone || 'America/Los_Angeles';
        let userId = event.user._id;

        if(!(userId && classId && startDate && endDate && attendees)) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
          let promise = await Promise.all([
            this.service.findById(classId),
            this.service.findByParentIdAndStartDate(classId, startDate)
          ])

          let classObj = promise[0];
          let existingClass = promise[1];
          let academyId = classObj.academyId.toString();

          let academyOwner = await this.academyMemberService.findOne({'member._id': userId, 'academy._id': academyId, isOwner: true});

          if(!academyOwner) {
            return handleError(401, 'Unauthorized');
          }

          if(!classObj) {
            return handleError(400, 'You need to pass a valid object');
          }

          let classToUpdate;
          let exactClassExists = !classObj.schedule.recurring || moment(classObj.schedule.startDate).valueOf() === moment(startDate).valueOf() || existingClass;
          if(exactClassExists) {
            classToUpdate = existingClass || classObj;
          } else {
            // if startDate is not multiple of original class date -> throw error
            let isValid = this.validateWithRecurringClass(classObj.schedule.interval, classObj.schedule.startDate, startDate, timezone);
            if(!isValid) {
              return handleError(400, 'startDate does not match recurring class');
            }

            classToUpdate = await this.createNewClassFromExisting(classObj, startDate, endDate);
          }

          classToUpdate.attendees = attendees
          entity = await this.service.update(classToUpdate._id, classToUpdate);

        } catch(e) {
          return handleError(500, 'Unable to update attendance', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Updated attendees',
                entity
            })
        };
    };

    validateWithRecurringClass(interval, originalStartDate, startDate, timezone = "America/Los_Angeles") {

      if(moment(originalStartDate).valueOf() === moment(startDate).valueOf()) {
        return true;
      }

      if(moment(originalStartDate).valueOf() >= moment(startDate).valueOf()) {
        return false;
      }

      let intervalDays = this.getIntervalDays(interval);
      originalStartDate = moment(originalStartDate).tz(timezone).add(intervalDays, 'days').toDate();

      return this.validateWithRecurringClass(interval, originalStartDate, startDate, timezone);
    }

    getIntervalDays(interval) {
      switch(interval) {
        case 'daily':
          return 1;
        break;
        case 'weekly':
          return 7;
        break;
        case 'semiMonthly':
          return 14;
        break;
        case 'monthly':
          return 31;
        break;
      }
    }

    getRecurringEntities(entity, startDate, endDate, interval, parentId, excludes = [], timezone = "America/Los_Angeles") {
      let entityStartDate = moment(entity.schedule.startDate).tz(timezone)

      if(entityStartDate > endDate) {
        return [];
      }

      let entities = [ ];
      if(!excludes.find(excludeDate => moment(excludeDate).valueOf() === entityStartDate.valueOf()) && moment(startDate).valueOf() <= entityStartDate.valueOf()) {
        entities.push(entity);
      }

      let newEntity = JSON.parse(JSON.stringify(entity));

      let intervalDays = this.getIntervalDays(interval);
      newEntity.schedule.startDate = moment(newEntity.schedule.startDate).tz(timezone).add(intervalDays, 'days').toDate();
      newEntity.schedule.endDate = moment(newEntity.schedule.endDate).tz(timezone).add(intervalDays, 'days').toDate();

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
        let ownerMemberships = await this.academyMemberService.findOne({ 'member._id': user._id,'academy._id': classObj.academyId, isOwner: true });
        return (ownerMemberships || user.admin === true)
    }
}

module.exports = ClassController
