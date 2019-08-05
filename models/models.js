let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let MartialArtSchema = new Schema({
    name: { type: String, required: true, index: true, unique: true },
    description: String,
    countryOfOrigin: String,
    icon: String,
    img: String
})

let UserSchema = new Schema({
  email: { type: String, required: true, index: true, unique: true },
  alias: { type: String, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  martialArts: [ {
      id: String,
      name: String,
      thumbnailImg: String,
      profileImg: String,
      studentAcademies: {},
      ownerAcademies: {}
  } ]
});

let LocationSchema = new Schema({
  address: { type: String, required: true},
  address2: { type: String },
  zipCode: { type: String },
  stateRegion: { type: String },
  country: { type: String, required: true }
});

let AcademySchema = new Schema({
  owners: { type: [ UserSchema ], required: true, index: true },
  school: {
    id: String,
    name: String
  },
  name: { type: String, required: true, index: true },
  locations: { type: [ LocationSchema ] },
  students: { type: [ UserSchema ] }
});

let SchoolSchema = new Schema({
  founders: {
      id: String,
      alias: String,
      firstName: String,
      lastName: String
  },
  name: { type: String, required: true, index: true }
});

let daysOfWeek = [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday' ];
let scheduleEntity = [ 'class', 'event' ];
let ScheduleSchema = new Schema({
  name: String,
  description: String,
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  recurring: Boolean,
  recurringUntil: { type: Date, index: true },
  recurringParent: String,
  daily: Boolean,
  weekly: Boolean,
  daysOfWeek: { type: [String], enum: daysOfWeek },
  entity: {
    type: { type: String, enum: scheduleEntity },
    id: { type: String },
    academyId: String
  },
  excludes: [String]
});

let ClassSchema = new Schema({
  academyId: { type: String },
  attendees: {
    id: String,
    alias: String,
    firstName: String,
    lastName: String,
    thumbnailImg: String
  }
});

let EventSchema = new Schema({
  academyId: { type: String },
  attendees: {
    id: String,
    alias: String,
    firstName: String,
    lastName: String,
    thumbnailImg: String
  }
});

module.exports = {
    MartialArtSchema,
    MartialArt: mongoose.model('MartialArt', MartialArtSchema),
    UserSchema,
    User: mongoose.model('User', UserSchema),
    AcademySchema,
    Academy: mongoose.model('Academy', AcademySchema),
    SchoolSchema,
    School: mongoose.model('School', SchoolSchema),
    ScheduleSchema,
    Schedule: mongoose.model('Schedule', ScheduleSchema),
    ClassSchema,
    Class: mongoose.model('Class', ClassSchema),
    EventSchema,
    Event: mongoose.model('Event', EventSchema),
    LocationSchema,
    Location: mongoose.model('Location', LocationSchema),
}
