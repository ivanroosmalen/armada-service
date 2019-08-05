var mongoose = require('mongoose');
require('dotenv').config({ path: './variables.env' });

module.exports.dbSetup = async () => {
    if(!mongoose.connection || mongoose.connection.readyState == 0) {
        await mongoose.connect(process.env.dbConnectionString, {useNewUrlParser: true});
    }
};
