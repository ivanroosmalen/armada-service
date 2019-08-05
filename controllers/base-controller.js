const { handleError } = require('../utils/error-handler.js');

class BaseController {
    constructor(service) {
        this.service = service;
    }

    async createEntity(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity;
        try {
            let body = JSON.parse(event.body);
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

    async updateEntity(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity;
        try {
            let id = event.pathParameters.id;
            let body = JSON.parse(event.body);

            user = await this.service.update(id, body);
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

    async getEntity(event) {
        if(!event || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass a valid id');
        }

        let entity
        try {
            let id = event.pathParameters.id;
            entity = await this.service.findById(id);
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

    async listEntities() {
        let entities;

        try {
            entities = await this.service.list()
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

    async deleteEntity(event) {
        if(!event || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass a valid id');
        }

        try {
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

module.exports = {
  BaseController
}
