const settings = require('../settings.js');
const { Academy } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');

const handler = getHandler({
    stackOptions: {
        validation: { schema: Academy },
        type: 'mongoose'
    }
}, settings);

module.exports = handler;
