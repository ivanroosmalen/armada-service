var mongoose = require('mongoose');
const settings = require('../settings');
const { User, JwtToken } = require('../models/models.js');
const bcrypt = require('bcrypt');

async function setupAdmin() {
  await mongoose.connect('mongodb+srv://root:root@vanroosmalen-xvrlb.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true});

  let user = await User.findOne({email: 'admin@armada.com'})

  if(!user) {
    user = {};
    user.email = 'admin@armada.com';
    user.alias = 'admin';
    user.admin = true;
    user.password = bcrypt.hashSync('admin', settings.auth.saltRounds);
    user.verified = true;
    let response = await User.create(user);
  }
}

setupAdmin();
