import { query } from "../db.js";
import { v4 as uuid } from "uuid";

const ENTITY_TABLES = {
  customers: "customers",
  products: "products",
  invoices: "invoices",
  companyProfiles: "company_profiles",
};

function resolveTableName(entityName) {
  const tableName = ENTITY_TABLES[entityName];
  if (!tableName) {
    throw new Error(`Unsupported entity repository: ${entityName}`);
  }
  return tableName;
}

export function createEntityRepository(entityName) {
  const tableName = resolveTableName(entityName);

  return {
    async listByOrganization(organizationId) {
      const result = await query(`SELECT id, data FROM ${tableName} WHERE organization_id = $1 ORDER BY id DESC`, [organizationId]);
      return result.rows.map((row) => ({ id: row.id, ...row.data }));
    },

    async createForOrganization(organizationId, payload) {
      const id = uuid();
      await query(`INSERT INTO ${tableName}(id, organization_id, data) VALUES($1, $2, $3)`, [id, organizationId, payload]);
      return { id, ...payload };
    },

    async updateForOrganization(id, organizationId, payload) {
      await query(`UPDATE ${tableName} SET data = $1 WHERE id = $2 AND organization_id = $3`, [payload, id, organizationId]);
      return { id, ...payload };
    },

    async deleteForOrganization(id, organizationId) {
      await query(`DELETE FROM ${tableName} WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
      return { ok: true };
    },
  };
}
