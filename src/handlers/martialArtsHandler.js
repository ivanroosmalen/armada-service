const settings = require('../settings.js');
const { MartialArt } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');

const handler = getHandler({
    stackOptions: {
        validation: { schema: MartialArt },
        type: 'mongoose'
    }
}, settings);

module.exports = handler;
