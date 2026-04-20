import { db } from './db/index.js';
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

  const q = String(query || '').toLowerCase().trim();

  return rows
    .filter((row) =>
      (row.data?.company_name || '').toLowerCase().includes(q) ||
      (row.data?.org_number || '').toLowerCase().includes(q)
    )
    .slice(0, limit)
    .map((row) => ({
      ...row.data,
      label: `${row.data?.company_name || ''}${row.data?.org_number ? ` · ${row.data.org_number}` : ''}`,
      description: [
        row.data?.address,
        row.data?.postal_code && row.data?.city ? `${row.data.postal_code} ${row.data.city}` : ''
      ].filter(Boolean).join(' • '),
      source: 'local'
    }));
}

export async function searchLocalCompany(orgId, query) {
  const items = await searchLocalCompanies(orgId, query, 1);
  return items[0] || null;
}

export async function searchExternalCompanies(query, limit = 8) {
  try {
    const res = await axios.get(`https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(query)}`);
    const items = Array.isArray(res.data?.searchResultItems) ? res.data.searchResultItems : [];

    return items.slice(0, limit).map((item) => ({
      company_name: item.companyName || item.companyPopularName || '',
      org_number: formatOrgNumber(item.orgNr || ''),
      address: item.address || '',
      postal_code: item.postNr || '',
      city: item.postOrt || '',
      country: 'Sverige',
      source: 'external'
    }));
  } catch {
    return [];
  }
}

export async function searchExternalCompany(query) {
  const items = await searchExternalCompanies(query, 1);
  return items[0] || null;
}
