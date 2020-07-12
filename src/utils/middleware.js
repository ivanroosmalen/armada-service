const createError = require('http-errors');
const { HttpError } = createError;
const middy = require('middy');
const tokenService = require('../services/token-service.js');
const UserService = require('../services/user-service.js');
const { User } = require('../models/models.js');
const authUtils = require('./auth-utils.js');
const handleError = require('./error-handler.js');
const {
    validator
} = require('middy/middlewares');

const userService = new UserService(User);

function defineMiddlewareStack(controllerRoute, middlewares = []) {
    return middlewares.reduce((stack, middleware) => stack.use(middleware), middy(controllerRoute));
}

function handlerAssert(value) {
    if (!value) throw createError.Unauthorized('Unauthorized');
}

const errorHandler = () => ({
    onError: (handler, next) => {
        if (handler.error instanceof HttpError) {
            handler.response = {
                body: JSON.stringify({
                    errors: [{
                        status: handler.error.statusCode,
                        message: handler.error.message,
                        detail: handler.error.details
                    }]
                }),
                statusCode: handler.error.statusCode
            };
            return next();
        }

        return next();
    }
});

const authentication = () => ({
    before: async (handler, next) => {
        let token = authUtils.getBearerToken(handler.event.headers);
        if (!token) {
            return handler.callback(null, handleError(401, 'Unauthorized'))
        }

        try {
            let decoded = tokenService.decode(token);
            let suffix = await userService.getByJwt(decoded.user.jwt);
            if (suffix) {
                let secret = tokenService.getSecret(suffix);
                let result = tokenService.verify(token, secret);
                delete result.user.jwt;
                delete result.user.jwtExpiration;
                delete result.user.password;
                handler.event.user = result.user;
                next();
                return;
            }
        } catch (e) {
            console.error("Authorization failure", e)
        }

        return handler.callback(null, handleError(401, 'Unauthorized'))
    }
})

module.exports = {
    defineMiddlewareStack,
    errorHandler,
    authentication
};
