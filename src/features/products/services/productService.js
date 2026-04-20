import { base44 } from "@/api/base44Client";

export const productService = {
  getAll() {
    return base44.entities.Product.list();
  },
  create(data) {
    return base44.entities.Product.create(data);
  },
  update(id, data) {
    return base44.entities.Product.update(id, data);
  },
  remove(id) {
    return base44.entities.Product.delete(id);
  }
};

export default productService;
