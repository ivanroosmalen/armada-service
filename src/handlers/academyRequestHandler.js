const settings = require('../settings.js');
const { AcademyRequest } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');
const { errorHandler, authentication } = require('../utils/middleware.js');
const { jsonBodyParser, doNotWaitForEmptyEventLoop, cors, httpHeaderNormalizer } = require('middy/middlewares');

const handler = getHandler({
    stackOptions: {
        validation: { schema: AcademyRequest },
        type: 'mongoose'
    }
}, settings);

module.exports = handler;
