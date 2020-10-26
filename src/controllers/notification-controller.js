const BaseController = require('./base-controller.js');
const emailService = require('../services/email-service.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');

class NotificationController extends BaseController {
    constructor(notificationService, userService, academyService, academyMemberService) {
        super(notificationService);
        this.userService = userService;
        this.academyService = academyService;
        this.academyMemberService = academyMemberService;
    }

    async create(event) {
        if(!event.body || !event.body.message || !event.body.academy || !event.body.academy._id) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
            let promises = await Promise.all([
              this.academyMemberService.findOne({ 'member._id': event.user._id,'academy._id': event.body.academy._id, isOwner: true }),
              this.academyMemberService.list({ 'academy._id': event.body.academy._id }),
              this.userService.findById(event.user._id)
            ])
            let academyMember = promises[0];
            let academyMembers = promises[1];
            let user = promises[2];

            if(!(academyMember || event.user.admin === true )) {
              return handleError(401, 'Unauthorized');
            }

            let notification = event.body;

            notification.academy = academyMember.academy;
            notification.user = academyMember.member;
            notification.createdDate = new Date();

            entity = await this.service.create(notification);

            let userIds = academyMembers.map(member => member.member._id);
            let users = await this.userService.list({ _id: { $in: userIds}}, {}, true);
            let emails = users.map(user => (user.email));

            //TODO update for handling portuguese emails
            await emailService.sendNotificationEmail(emails, entity);
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
        if(!event.body || !event.body.message || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity;
        try {
            let notification = await this.service.findById(event.pathParameters.id);
            if(!notification) {
              return handleError(400, 'Notification does not exist', e);
            }

            let academyOwner = this.academyMemberService.findOne({ 'member._id': event.user._id,'academy._id': notification.academy._id, isOwner: true });
            if(!(academyOwner || event.user.admin === true )) {
              return handleError(401, 'Unauthorized');
            }

            notification.message = event.body.message;
            entity = await this.service.update(notification._id, notification);
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

    async list(event) {
        let queryStrings = event.queryStringParameters;
        let params = this._getListQuery(queryStrings);
        let academyIds = [];
        if(!queryStrings || !queryStrings.academyIds) {
            return handleError(500, 'Must pass one or more academy ids');
        } else {
            academyIds = queryStrings.academyIds.split(',').map(academyId => academyId.trim());
        }

        let entities;
        try {
            let memberAcademies = await this.academyMemberService.list({ 'member._id': event.user._id,'academy._id': { $in: academyIds }});
            if(!(memberAcademies && memberAcademies.length)) {
                return handleError(500, 'User is not a member of these academies');
            }

            let filteredIds = academyIds.filter(id => {
              return !!memberAcademies.find(ma => ma.academy._id === id)
            })

            entities = await this.service.list({ 'academy._id': { $in: filteredIds } }, { sort: { createdDate: -1 } });
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

        let entity = {}
        // try {
        //     let id = event.pathParameters.id;
        //     entity = await this.service.findById(id);
        // } catch(e) {
        //     return handleError(500, 'Unable to find entity', e);
        // }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Entity returned',
                entity
            })
        };
    };

    async delete(event) {
        if(!event || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass a valid id');
        }

        try {
            let notification = await this.service.findById(event.pathParameters.id);
            if(!notification) {
              return handleError(400, 'Notification does not exist', e);
            }

            let academyOwner = this.academyMemberService.findOne({ 'member._id': event.user._id,'academy._id': notification.academy._id, isOwner: true });
            if(!(academyOwner || event.user.admin === true )) {
              return handleError(401, 'Unauthorized');
            }

            await this.service.deleteById(event.pathParameters.id)
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
}

module.exports = NotificationController
