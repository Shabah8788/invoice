import { createEntityRepository } from "../repositories/baseRepository.js";

export function createEntityService(entityName) {
  const repo = createEntityRepository(entityName);

  return {
    async list(orgId) {
      return repo.listByOrganization(orgId);
    },

    async create(orgId, data) {
      return repo.createForOrganization(orgId, data);
    },

    async update(orgId, id, data) {
      return repo.updateForOrganization(id, orgId, data);
    },

    async remove(orgId, id) {
      return repo.deleteForOrganization(id, orgId);
    },
  };
}
