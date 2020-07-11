const settings = require('../settings.js');
const { Class } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Class },
        type: 'mongoose'
    }
}, settings);

module.exports = handler;
