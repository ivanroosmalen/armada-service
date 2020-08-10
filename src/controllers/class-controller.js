const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const moment = require('moment');
const settings = require('../settings.js');

class ClassController extends BaseController {
    constructor(classService, userService) {
        super(classService);

        this.userService = userService
    }

    async create(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
            entity = await this.service.create(event.body);
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

    async attend(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let { classId, startDate, endDate } = event.body;
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
          ])

          let user = promise[0];
          let classObj = promise[1];
          let existingClass = promise[2];

          if(!(user && classObj)) {
            return handleError(400, 'You need to pass a valid object');
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
            thumbnailImg: user.thumbnailImg
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

    async createNewClassFromExisting(classObj, startDate, endDate) {
      // Need to create new class and schedule item, so add excluding date to parent
      classObj.schedule.excludes = classObj.schedule.excludes || [];
      classObj.schedule.excludes.push(startDate);
      await this.service.update(classObj._id, classObj)
      console.log(classObj)
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
}

module.exports = ClassController
