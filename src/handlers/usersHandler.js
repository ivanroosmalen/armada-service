const settings = require('../settings.js');
const { User, JwtToken } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const UserService = require('../services/user-service.js');
const UserController = require('../controllers/user-controller.js');
const TokenService = require('../services/token-service.js');
const { errorHandler } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: User },
        type: 'mongoose'
    },
    controller: new UserController(new UserService(User), new TokenService(JwtToken)),
    customRoutes: {
        register: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
        login: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
        logout: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()]
    }
}, settings);

module.exports = handler;
