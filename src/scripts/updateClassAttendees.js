var mongoose = require('mongoose');
const settings = require('../settings');
const { Class, AcademyMember } = require('../models/models.js');

async function updateClassAttendees() {
  await mongoose.connect('mongodb+srv://armada:Dr7yoe9uEOMfKeDp@armada.xvrlb.mongodb.net/armada?retryWrites=true&w=majority', {useNewUrlParser: true});

  let classes = await Class.find();

  console.log("Update attendees")
  for(let classObj of classes) {
    let attendees = [];
    for(let attendee of classObj.attendees) {
      let academyMember = await AcademyMember.findOne({ 'member._id': attendee._id });
      attendee.academyMember = academyMember.toObject();
    }

    for(let instructor of classObj.instructors) {
      let academyMember = await AcademyMember.findOne({ 'member._id': instructor._id });
      instructor.academyMember = academyMember.toObject();
    }

    try {
      let response = await Class.findByIdAndUpdate(classObj._id.toString(), classObj);
    } catch(e) {
      console.log(e)
    }

  }

  console.log("Complete")

}

updateClassAttendees();
