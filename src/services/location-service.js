const settings = require('../settings');
const MongooseService = require('./mongoose-service');

class LocationService extends MongooseService {

  constructor(schema) {
      super(schema);
  }

  async listByUserLocation(lat, lng, entityType) {
      let query = {
        geo: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            }
          }
        },
        entityType
      }

      return this.schema.find(query, {}, { limit: 50 });
  };

  async listByWindow(latMin, latMax, lngMin, lngMax, entityType) {
      let query = {
        geo: {
          $within: {
            $geometry: {
                type: 'Polygon',
                coordinates: [[
                  [lngMin, latMax],
                  [lngMax, latMax],
                  [lngMax, latMin],
                  [lngMin, latMin],
                  [lngMin, latMax]
                ]]
            }
          }
        },
        entityType
      }

      return this.schema.find(query, {}, { limit: 50 });
  };

  async deleteByEntityId(entityId) {
      if(!entityId) {
          throw new Error('Cannot delete an entity without an id');
      }

      return this.schema.deleteMany({ entityId });
  };
}

module.exports = LocationService;
