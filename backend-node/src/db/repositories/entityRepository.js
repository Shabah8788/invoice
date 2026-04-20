import { and, eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import { db } from '../index.js';

export function createEntityRepository(table) {
  return {
    async listByOrganization(organizationId) {
      const rows = await db.query[table._.name].findMany({
        where: (fields, operators) => operators.eq(fields.organizationId, organizationId),
      });
      return rows.map((row) => ({ id: row.id, ...(row.data || {}) }));
    },

    async createForOrganization(organizationId, payload) {
      const id = uuid();
      await db.insert(table).values({ id, organizationId, data: payload });
      return { id, ...payload };
    },

    async updateForOrganization(id, organizationId, payload) {
      await db.update(table)
        .set({ data: payload })
        .where(and(eq(table.id, id), eq(table.organizationId, organizationId)));
      return { ok: true };
    },

    async deleteForOrganization(id, organizationId) {
      await db.delete(table)
        .where(and(eq(table.id, id), eq(table.organizationId, organizationId)));
      return { ok: true };
    },
  };
}
