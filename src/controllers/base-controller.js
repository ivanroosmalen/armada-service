const { handleError } = require('../utils/error-handler.js');

class BaseController {
    constructor(service) {
        this.service = service;
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

    async batchCreate(event) {
        if (!event || !event.body || event.body.length == 0) {
            return handleError(400, 'You need to pass a valid list of entities');
        }

        let entities;
        try {
            let body = event.body;

            entities = await this.service.batchCreate(body);
        } catch (e) {
            return handleError(500, 'Unable to create some entities: ', e);
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Entities created',
                result: entities
            })
        };
    }

    async update(event) {
        if(!event || !event.body || !event.pathParameters || !event.pathParameters.id) {
            return handleError(400, 'You need to pass entity info to update an entity');
        }

        let entity;
        try {
            let id = event.pathParameters.id;
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

    async get(event) {
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

    async list(event) {
        let params = this._getListQuery(event.queryStringParameters);

        let entities;
        try {
            entities = await this.service.list({}, params)
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

    async delete(event) {
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

    _getListQuery(queryParams) {
        let query = {};

        if(queryParams) {
            let pageSize = parseInt(queryParams.pageSize) || 1000;
            pageSize = pageSize < 1000 ? pageSize : 1000;
            let page = parseInt(queryParams.page) || 0;
            query.limit = pageSize;
            query.skip = pageSize * page;

            if(queryParams.sort) query.sort = queryParams.sort;
        }

        return query;
    }
}

module.exports = BaseController
