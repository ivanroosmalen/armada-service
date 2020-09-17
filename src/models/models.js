const GeoJSON = require('mongoose-geojson-schema');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

let modelKeys = Object.keys(mongoose.models);
if(!modelKeys || !modelKeys.length) {
    let MartialArtSchema = new Schema({
        name: { type: String, required: true, index: true, unique: true },
        subcategory: { type: String },
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
          startDate: Date
      } ]
    });

    let JwtTokenSchema = new Schema({
        suffix: { type: String, required: true, index: true, unique: true },
        user_id: { type: String, required: true },
    })

    let entityType = [ 'academy', 'event', 'class' ];
    let LocationSchema = new Schema({
      _id: { type: String },
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

    let interval = [ 'daily', 'weekly', 'monthly' ];
    let ScheduleSchema = new Schema({
      startDate: { type: Date, required: true, index: true },
      endDate: { type: Date, required: true, index: true },
      recurring: Boolean,
      interval: { type: String, enum: interval },
      excludes: [Date]
    });

    let ClassSchema = new Schema({
      academyId: { type: String },
      name: { type: String },
      description: { type: String },
      martialArt: { type: String },
      parentId: { type: String },
      location: { type: LocationSchema },
      instructors: [{
        _id: String,
        alias: String,
        firstName: String,
        lastName: String,
        thumbnailImg: String
      }],
      attendees: [{
        _id: String,
        alias: String,
        firstName: String,
        lastName: String,
        thumbnailImg: String,
        online: Boolean
      }],
      classSize: { type: Number },
      onlineClassSize: { type: Number },
      supportOnlineClasses: { type: Boolean },
      schedule: { type: ScheduleSchema }
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

    let AcademyRequestSchema = new Schema({
      academy: {
          _id: { type: String },
          name: { type: String }
      },
      user: {
        _id: String,
        alias: String,
        firstName: String,
        lastName: String,
        thumbnailImg: String
      },
      approved: Boolean,
      complete: Boolean
    });

    let NotifactionSchema = new Schema({
        message: { type: String },
        academy: {
          name: String,
          _id: String
        },
        user: {
          _id: String,
          alias: String,
          firstName: String,
          lastName: String,
          thumbnailImg: String
        },
        createdDate: Date
    })


    mongoose.model('MartialArt', MartialArtSchema);
    mongoose.model('User', UserSchema);
    mongoose.model('Academy', AcademySchema);
    mongoose.model('School', SchoolSchema);
    mongoose.model('Class', ClassSchema);
    mongoose.model('Event', EventSchema);
    mongoose.model('Location', LocationSchema);
    mongoose.model('JwtToken', JwtTokenSchema);
    mongoose.model('AcademyRequest', AcademyRequestSchema);
    mongoose.model('Notification', NotifactionSchema);
}

module.exports = mongoose.models
