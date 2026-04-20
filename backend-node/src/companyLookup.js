import { db } from './db.drizzle.js';
import { customers } from './schema.js';
import { eq } from 'drizzle-orm';
import axios from 'axios';

export function normalizeOrgNumber(value = '') {
  return String(value).replace(/\D/g, '');
}

export function formatOrgNumber(value = '') {
  const digits = normalizeOrgNumber(value);
  if (digits.length !== 10) return value || '';
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export function deriveVatNumber(value = '') {
  const digits = normalizeOrgNumber(value);
  if (digits.length !== 10) return '';
  return `SE${digits}01`;
}

export async function searchLocalCompany(orgId, lookupQuery) {
  const rows = await db.select().from(customers).where(eq(customers.organizationId, orgId));
  const q = lookupQuery.toLowerCase();

  const found = rows.find(r =>
    (r.data?.company_name || '').toLowerCase().includes(q) ||
    (r.data?.org_number || '').toLowerCase().includes(q)
  );

  return found ? found.data : null;
}

export async function searchLocalCompanies(orgId, lookupQuery, limit = 8) {
  const rows = await db.select().from(customers).where(eq(customers.organizationId, orgId));
  const q = lookupQuery.toLowerCase();

  return rows
    .filter(r =>
      (r.data?.company_name || '').toLowerCase().includes(q) ||
      (r.data?.org_number || '').toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map(r => ({
      ...r.data,
      label: `${r.data.company_name || ''}${r.data.org_number ? ` · ${r.data.org_number}` : ''}`,
      description: [r.data.address, r.data.postal_code && r.data.city ? `${r.data.postal_code} ${r.data.city}` : '']
        .filter(Boolean)
        .join(' • '),
      source: 'local'
    }));
}

export async function searchExternalCompanies(query, limit = 8) {
  try {
    const res = await axios.get(`https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(query)}`);
    const items = res.data?.searchResultItems || [];
    return items.slice(0, limit).map(item => ({
      company_name: item.companyName,
      org_number: formatOrgNumber(item.orgNr),
      source: 'external'
    }));
  } catch {
    return [];
  }
}

export async function searchExternalCompany(query) {
  const list = await searchExternalCompanies(query, 1);
  return list[0] || null;
}
