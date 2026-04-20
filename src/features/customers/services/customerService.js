import { base44 } from "@/api/base44Client";

export const customerService = {
  getAll() {
    return base44.entities.Customer.list();
  },
  create(data) {
    return base44.entities.Customer.create(data);
  },
  update(id, data) {
    return base44.entities.Customer.update(id, data);
  },
  remove(id) {
    return base44.entities.Customer.delete(id);
  }
};

export default customerService;
