const settings = require('../settings.js');
const { User, JwtToken, Academy, Class } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const UserService = require('../services/user-service.js');
const AcademyService = require('../services/academy-service.js');
const ClassService = require('../services/class-service.js');
const UserController = require('../controllers/user-controller.js');
const TokenService = require('../services/token-service.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: User },
        type: 'mongoose'
    },
    controller: new UserController(new UserService(User), new TokenService(JwtToken), new AcademyService(Academy), new ClassService(Class)),
    customRoutes: {
        register: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
        forgotPassword: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
        updatePassword: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        login: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), errorHandler()],
        logout: [doNotWaitForEmptyEventLoop(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
        uploadImage: [doNotWaitForEmptyEventLoop(), jsonBodyParser(), httpHeaderNormalizer(), cors(settings.cors), authentication(), errorHandler()],
    }
}, settings);

module.exports = handler;
