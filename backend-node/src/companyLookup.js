// FULL FIXED VERSION
import { query } from './db.js';

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

function extractDeep(obj, results = []) {
  if (!obj) return results;

  if (Array.isArray(obj)) {
    obj.forEach(i => extractDeep(i, results));
    return results;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj).join(' ').toLowerCase();

    if (
      keys.includes('namn') ||
      keys.includes('org') ||
      keys.includes('post')
    ) {
      results.push(obj);
    }

    Object.values(obj).forEach(v => {
      if (typeof v === 'object') extractDeep(v, results);
    });
  }

  return results;
}

function mapCompany(record, fallback) {
  const org = record.organisationsnummer || record.orgnr || record.org_number || '';

  return {
    company_name: record.namn || record.företagsnamn || fallback,
    org_number: formatOrgNumber(org),
    vat_number: deriveVatNumber(org),
    address: record.postadress || record.besöksadress || '',
    postal_code: record.postnummer || '',
    city: record.postort || '',
    country: 'Sverige',
    email: record.email || '',
    phone: record.telefon || ''
  };
}

export async function searchLocalCompany(orgId, lookupQuery) {
  const search = `%${lookupQuery.toLowerCase()}%`;

  const customers = await query(
    `SELECT data FROM customers WHERE organization_id=$1 AND (lower(data->>'company_name') LIKE $2 OR lower(data->>'org_number') LIKE $2) LIMIT 1`,
    [orgId, search]
  );

  if (customers.rows[0]) return customers.rows[0].data;

  return null;
}

export async function searchExternalCompany(query) {
  const url = `https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json'
    }
  });

  if (!res.ok) return null;

  const json = await res.json();

  const candidates = extractDeep(json);

  if (!candidates.length) return null;

  return mapCompany(candidates[0], query);
}
