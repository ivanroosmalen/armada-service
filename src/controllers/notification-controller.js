const BaseController = require('./base-controller.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');

class NotificationController extends BaseController {
    constructor(notificationService, userService, academyService) {
        super(notificationService);
        this.userService = userService;
        this.academyService = academyService;
    }

    async create(event) {
        if(!event.body || !event.body.message || !event.body.academy || !event.body.academy._id) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
            let academy = await this.academyService.findById(event.body.academy._id)
            if(!academy) {
              return handleError(400, 'Academy does not exist', e);
            }

            if(!this.isAuthorizedByOwnership(academy, event.user)) {
              return handleError(401, 'Unauthorized');
            }

            let user = await this.userService.findById(event.user._id);
            let notification = event.body;

            notification.academy = {
              _id: academy._id,
              name: academy.name
            };

            notification.user = {
              _id: user._id,
              alias: user.alias,
              firstName: user.firstName,
              lastName: user.lastName,
              thumbnailImg: user.thumbnailImg
            };
            notification.createdDate = new Date();

            entity = await this.service.create(notification);
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

            let academy = await this.academyService.findById(notification.academy._id)
            if(!academy) {
              return handleError(400, 'Academy does not exist', e);
            }

            if(!this.isAuthorizedByOwnership(academy, event.user)) {
              return handleError(401, 'Unauthorized');
            }

            notification.message = event.body.message;
            entity = await this.service.update(notification);
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
            let promiseFuncs = [];
            for(let academyId of academyIds) {
              promiseFuncs.push(this.academyService.list(
                {
                  _id: academyId,
                  $or: [
                    { 'owners._id': event.user._id },
                    { 'instructors._id': event.user._id },
                    { 'students._id': event.user._id }
                  ]
                }
              ));
            }
            let promises = await Promise.all(promiseFuncs);

            for(let academies of promises) {
                if(!academies || !academies.length) {
                    return handleError(500, 'User is not a member of all requested academies');
                }
            }

            entities = await this.service.list({ 'academy._id': { $in: academyIds } }, { sort: { createdDate: -1 } });
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

            let academy = await this.academyService.findById(notification.academy._id)
            if(!academy) {
              return handleError(400, 'Academy does not exist', e);
            }

            if(!this.isAuthorizedByOwnership(academy, event.user)) {
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

    isAuthorizedByOwnership(academy, user) {
        return ((academy.owners && academy.owners.find(owner => (owner._id.toString() === user._id.toString()))) || user.admin === true)
    }

}

module.exports = NotificationController
