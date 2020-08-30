var mongoose = require('mongoose');
const settings = require('../settings');
const { User, JwtToken } = require('../models/models.js');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  await mongoose.connect('mongodb+srv://root:root@armada.xvrlb.mongodb.net/armada?retryWrites=true&w=majority', {useNewUrlParser: true});

  let user = await User.findOne({email: 'admin@armada.com'})

  if(!user) {
    user = {};
    user.email = 'admin@armada.com';
    user.alias = 'admin';
    user.admin = true;
    user.password = bcrypt.hashSync('GX8n]KKman2jD)uj', settings.auth.saltRounds);
    user.verified = true;
    let response = await User.create(user);
  }
}

setupAdmin();
