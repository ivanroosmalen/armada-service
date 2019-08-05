const { User } = require('../models/models.js');
const { getHandler } = require('./baseHandler.js');

module.exports = getHandler(User);
