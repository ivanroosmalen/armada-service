var mongoose = require('mongoose');
const settings = require('../settings');
const { Academy, AcademyMember } = require('../models/models.js');

async function createAcademyMembers() {
  await mongoose.connect('mongodb+srv://armada:Dr7yoe9uEOMfKeDp@armada.xvrlb.mongodb.net/armada?retryWrites=true&w=majority', {useNewUrlParser: true});

  let academies = await Academy.find();

  console.log("Creating members")
  academies && academies.forEach(academy => {
    academy.students.forEach(member => {
      let isOwner = !!academy.owners.find(owner => owner._id.toString() === member._id.toString());
      let academyMember = {
        academy: {
          _id: academy._id,
          name: academy.name
        },
        member: member,
        martialArts: [
          'Capoeira'
        ],
        isInstructor: !!academy.instructors.find(inst => inst._id.toString() === member._id.toString()),
        isOwner: isOwner,
        isManager: isOwner
      }

      AcademyMember.create(academyMember)
    });

  })
  console.log("Complete")

}

createAcademyMembers();
