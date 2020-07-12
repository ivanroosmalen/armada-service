const BaseController = require('./base-controller.js');
const tokenService = require('../services/token-service.js');
const authUtils = require('../utils/auth-utils.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const moment = require('moment');

class UserController extends BaseController {
    constructor(service) {
        super(service);
    }

    async login(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity = {};
        try {
            let user = await this.service.login(event.body.email, event.body.password);
            entity.jwt = await this.generateJWT(user);
        } catch(e) {
            return handleError(500, 'Unable to login', e);
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Logged in',
                entity: entity
            })
        };
    };

    async register(event) {
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

    async generateJWT(user) {
        let secret = tokenService.createSecret();
        let jwt = '';
        let payload = {
            user: user
        };

        try {
            user.jwt = tokenService.getSecretSuffix(secret);
            user.jwtExpiration = moment().add(settings.jwt.exp);

            await this.service.update(user._id, user)
            jwt = tokenService.sign(payload, secret, settings.jwt.exp);
        } catch (e) {
            console.error(e);
        }
        return jwt;
    }
}

module.exports = UserController
