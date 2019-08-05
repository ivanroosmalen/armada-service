class BaseService {

  constructor(schema) {
    this.schema = schema;
  }

  async create(entity) {
      if(!entity) {
          throw new Error('Cannot create invalid entity');
      }

      return await this.schema.create(entity);
  };

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

module.exports = {
  BaseService
}
