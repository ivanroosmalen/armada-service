const BaseController = require('./base-controller.js');
const tokenService = require('../services/token-service.js');
const authUtils = require('../utils/auth-utils.js');
const { handleError } = require('../utils/error-handler.js');
const settings = require('../settings.js');
const moment = require('moment');

class UserController extends BaseController {
    constructor(userService, tokenService) {
        super(userService);

        this.tokenService = tokenService;
    }

    cleanseUser(user) {
        user.password = undefined;
        user.jwt = undefined;
        user.jwtExpiration = undefined;

        return user;
    }

    async login(event) {
        if(!event || !event.body) {
            return handleError(400, 'You need to pass a valid object');
        }

        let entity = {};
        try {
            let user = await this.service.login(event.body.email, event.body.password);
            entity.jwt = await this.generateJWT(user);
            entity.user = this.cleanseUser(user);
        } catch(e) {
            return handleError(500, 'Unable to login', e);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Logged in',
                entity: entity
            })
        };
    };

    async logout(event) {
        let token = authUtils.getBearerToken(event.headers);
        if (!token) {
            return;
        }

        let decoded = this.tokenService.decode(token);
        await this.tokenService.removeByJwt(decoded.user.jwt);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Logged out',
                entity: {}
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
        let secret = this.tokenService.createSecret();
        let jwt = '';
        let payload = {
            user: user
        };

        try {
            user.jwt = this.tokenService.getSecretSuffix(secret);
            user.jwtExpiration = moment().add(settings.jwt.exp);

            let jwtToken = {
                user_id: user._id,
                suffix: user.jwt
            };
            await this.tokenService.create(jwtToken);
            jwt = this.tokenService.sign(payload, secret, settings.jwt.exp);
        } catch (e) {
            console.error(e);
        }
        return jwt;
    }
}

module.exports = UserController
