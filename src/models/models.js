let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let modelKeys = Object.keys(mongoose.models);
if(!modelKeys || !modelKeys.length) {
    let MartialArtSchema = new Schema({
        name: { type: String, required: true, index: true, unique: true },
        description: String,
        countryOfOrigin: String,
        icon: String,
        img: String
    })

    let UserSchema = new Schema({
      email: { type: String, required: true, index: true, unique: true },
      password: { type: String, required: true },
      alias: { type: String, index: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      jwt: { type: String },
      jwtExpiration: { type: Date },
      martialArts: [ {
          _id: String,
          name: String,
          thumbnailImg: String,
          profileImg: String,
          studentAcademies: {},
          ownerAcademies: {}
      } ]
    });

    let LocationSchema = new Schema({
      address: { type: String },
      address2: { type: String },
      zipCode: { type: String },
      city: { type: String },
      stateRegion: { type: String },
      country: { type: String },
      lat: { type: String },
      lon: { type: String }
    });

    let AcademySchema = new Schema({
      owners: { type: [ UserSchema ], required: true, index: true },
      name: { type: String, required: true, index: true },
      martialArts: { type: [ MartialArtSchema ]},
      locations: { type: [ LocationSchema ] },
      students: { type: [ UserSchema ] },
      img: String
    });

    let SchoolSchema = new Schema({
      founders: {
        type: [{
          _id: String,
          alias: String,
          firstName: String,
          lastName: String
        }]
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
        _id: { type: String },
        academyId: String
      },
      excludes: [String]
    });

    let ClassSchema = new Schema({
      academyId: { type: String },
      location: { type: LocationSchema },
      attendees: {
        _id: String,
        alias: String,
        firstName: String,
        lastName: String,
        thumbnailImg: String
      }
    });

    let EventSchema = new Schema({
      academyId: { type: String },
      location: { type: LocationSchema },
      attendees: {
        _id: String,
        alias: String,
        firstName: String,
        lastName: String,
        thumbnailImg: String
      }
    });

    mongoose.model('MartialArt', MartialArtSchema);
    mongoose.model('User', UserSchema);
    mongoose.model('Academy', AcademySchema);
    mongoose.model('School', SchoolSchema);
    mongoose.model('Schedule', ScheduleSchema);
    mongoose.model('Class', ClassSchema);
    mongoose.model('Event', EventSchema);
    mongoose.model('Location', LocationSchema);
}

module.exports = mongoose.models
