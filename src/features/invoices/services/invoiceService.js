import { base44 } from "@/api/base44Client";

export const invoiceService = {
  async getAll() {
    return await base44.entities.Invoice.list();
  },

  async getById(id) {
    return await base44.entities.Invoice.get(id);
  },

  async create(data) {
    return await base44.entities.Invoice.create(data);
  },

  async update(id, data) {
    return await base44.entities.Invoice.update(id, data);
  },

  async remove(id) {
    return await base44.entities.Invoice.delete(id);
  }
};
