class MongooseService {

  constructor(schema) {
    this.schema = schema;
  }

  async create(entity) {
      if(!entity) {
          throw new Error('Cannot create invalid entity');
      }

      return await this.schema.create(entity);
  };

  async batchCreate(entities) {
      if (!entities || entities.length === 0) {
          throw new Error('Cannot create invalid entity');
      }

      let result = await this.model.insertMany(entities, { ordered: false, rawResult: true });

      if (result.mongoose && result.mongoose.validationErrors && result.mongoose.validationErrors.length) {
          throw new Error(result.mongoose.validationErrors);
      }

      if (result.insertedCount != entities.length) {
          throw new Error('Not all entities were stored');
      }

      return result.ops;
  }

  async update(id, entity) {
      if(!id) {
          throw new Error('Cannot update a entity without an id');
      }

      if(!entity) {
          throw new Error('Cannot create invalid entity');
      }

      entity.lastUpdatedDate = new Date();

      return this.schema.findByIdAndUpdate(id, entity, {new: true});
  };

  async findById(id) {
      if(!id) {
          throw new Error('Cannot find an entity without an id');
      }

      return this.schema.findById(id);
  };

  async list(id) {
      return this.schema.find();
  };

  async deleteById(id) {
      if(!id) {
          throw new Error('Cannot delete an entity without an id');
      }

      return this.schema.deleteOne({ _id: id });
  };
}

module.exports = MongooseService
