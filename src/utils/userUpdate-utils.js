const academyMemberService = require('../services/academyMember-service.js');
const academyService = require('../services/academy-service.js');
const classService = require('../services/class-service.js');

async function userUpdated(id, entity) {
  await Promise.all([
    academyMemberService.updateUser(id, entity),
    academyService.updateUser(id, entity),
    classService.updateUser(id, entity)
  ])
}

module.exports = {
    userUpdated
};
