const { BaseService } = require('../services/base-service.js');
const { BaseController } = require('../controllers/base-controller.js');

const { dbSetup } = require('../db/mongoose-utils.js');
dbSetup();

module.exports.getHandler = (model, controller) => {
    if(!controller) {
      let service = new BaseService(model);
      controller = new BaseController(service);
    }

    return {
        listEntities: async () => {
            return await controller.listEntities();
        },
        createEntity: async event => {
            return await controller.createEntity(event);
        },
        updateEntity: async event => {
            return await controller.updateEntity(event);
        },
        getEntity: async event => {
            return await controller.getEntity(event);
        },
        deleteEntity: async event => {
            return await controller.deleteEntity(event);
        }
    }
}
