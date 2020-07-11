const settings = require('../settings.js');
const { School } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');

const handler = getHandler({
    stackOptions: {
        validation: { schema: School },
        type: 'mongoose'
    }
}, settings);

module.exports = handler;
