import { db } from './db/index.js';
import { customers } from './db/schema.js';
import axios from 'axios';

export function normalizeOrgNumber(value = '') {
  return String(value).replace(/\D/g, '');
}

export function formatOrgNumber(value = '') {
  const digits = normalizeOrgNumber(value);
  if (digits.length !== 10) return value || '';
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export async function searchLocalCompanies(orgId, query, limit = 8) {
  const rows = await db.query.customers.findMany({
    where: (fields, ops) => ops.eq(fields.organizationId, orgId),
  });

  const q = query.toLowerCase();

  return rows
    .filter(r =>
      (r.data?.company_name || '').toLowerCase().includes(q) ||
      (r.data?.org_number || '').toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map(r => ({
      ...r.data,
      source: 'local'
    }));
}

export async function searchExternalCompanies(query) {
  try {
    const res = await axios.get(`https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(query)}`);
    return res.data?.searchResultItems || [];
  } catch {
    return [];
  }
}
