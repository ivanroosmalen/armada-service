const createError = require('http-errors');
const { HttpError } = createError;
const middy = require('middy');
const tokenService = require('../services/token-service.js');
const authUtils = require('./auth-utils.js');
const {
    validator
} = require('middy/middlewares');

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

const authentication = (userService) => ({
    before: async (handler, next) => {
        let token = authUtils.getBearerToken(handler.event.headers);
        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    message: 'No Authorization Header',
                    entity: {
                        valid: false
                    }
                })
            };
        }
        let decoded = tokenService.decode(token);
        let body = {};
        try {
            let suffix = await userService.getByJwt(decoded.jti);
            if (suffix) {
                let secret = tokenService.getSecret(suffix);
                body = tokenService.verify(token, secret);

                next();
            }
            else body = { entity: { valid: false }, message: 'User logged out' };
        } catch (e) {
            body = { entity: { valid: false }, message: e.message };
        }
    }
})

module.exports = {
    defineMiddlewareStack,
    errorHandler,
    authentication
};
