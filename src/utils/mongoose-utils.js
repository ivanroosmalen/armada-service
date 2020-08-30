var mongoose = require('mongoose');
const settings = require('../settings');

module.exports.dbSetup = async () => {
    console.log(settings.mongo.connectionString)
    if(!mongoose.connection || mongoose.connection.readyState == 0) {
        await mongoose.connect(settings.mongo.connectionString, {useNewUrlParser: true, useUnifiedTopology: true});
    }
};
