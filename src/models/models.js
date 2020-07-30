const GeoJSON = require('mongoose-geojson-schema');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let modelKeys = Object.keys(mongoose.models);
if(!modelKeys || !modelKeys.length) {
    let MartialArtSchema = new Schema({
        name: { type: String, required: true, index: true, unique: true },
        subcategory: { type: String, unique: true },
        description: String,
        countryOfOrigin: String,
        icon: String,
        img: String
    })

    let UserSchema = new Schema({
      email: { type: String, required: true, index: true, unique: true },
      password: { type: String, required: true },
      alias: { type: String, index: true },
      firstName: { type: String },
      lastName: { type: String },
      thumbnailImg: String,
      profileImg: String,
      jwt: { type: String },
      jwtExpiration: { type: Date },
      emailVerificationToken: String,
      emailExpiration: Date,
      verified: Boolean,
      admin: { type: Boolean },
      martialArts: [ {
          _id: String,
          name: String,
          subcategory: String,
          level: String,
          startDate: Date,
          // studentAcademies: [],
          // ownerAcademies: [],
          // instructorAcademies: []
      } ]
    });

    let JwtTokenSchema = new Schema({
        suffix: { type: String, required: true, index: true, unique: true },
        user_id: { type: String, required: true },
    })

    let entityType = [ 'academy', 'event', 'class' ];
    let LocationSchema = new Schema({
      address: { type: String },
      placeId: { type: String },
      url: { type: String },
      geo: mongoose.Schema.Types.Point,
      type: { type: String },
      entityType: { type: String, enum: entityType  },
      entityId: { type: String }
    });

    let AcademySchema = new Schema({
      owners: [ {
        _id: { type: String },
        email: { type: String },
        alias: { type: String },
        thumbnailImg: { type: String }
      } ],
      instructors: [ {
        _id: { type: String },
        email: { type: String },
        alias: { type: String },
        thumbnailImg: { type: String }
      } ],
      students: [ {
        _id: { type: String },
        email: { type: String },
        alias: { type: String },
        thumbnailImg: { type: String }
      } ],
      name: { type: String, required: true, index: true },
      martialArts: [ {
        name: { type: String }
      } ],
      locations: { type: [ LocationSchema ] },
      profileImg: String
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
    mongoose.model('JwtToken', JwtTokenSchema);
}

module.exports = mongoose.models
