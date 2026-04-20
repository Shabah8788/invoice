import { query } from '../db.js';
import { getTable } from '../utils/table.js';
import { v4 as uuid } from 'uuid';

export async function list(table, orgId) {
  const t = getTable(table);
  const r = await query(`SELECT id,data FROM ${t} WHERE organization_id=$1`, [orgId]);
  return r.rows.map(x => ({ id: x.id, ...x.data }));
}

export async function create(table, orgId, data) {
  const t = getTable(table);
  const id = uuid();
  await query(`INSERT INTO ${t}(id,organization_id,data) VALUES($1,$2,$3)`, [id, orgId, data]);
  return { id };
}

export async function update(table, id, orgId, data) {
  const t = getTable(table);
  await query(`UPDATE ${t} SET data=$1 WHERE id=$2 AND organization_id=$3`, [data, id, orgId]);
}

export async function remove(table, id, orgId) {
  const t = getTable(table);
  await query(`DELETE FROM ${t} WHERE id=$1 AND organization_id=$2`, [id, orgId]);
}
