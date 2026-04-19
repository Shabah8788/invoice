import { query } from './db.js';
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

function parseAddress(address = '') {
  if (!address) return { street: '', postal_code: '', city: '' };

  const parts = String(address).split(',').map(p => p.trim()).filter(Boolean);
  const street = parts[0] || '';
  let postal_code = '';
  let city = '';

  for (const part of parts) {
    const match = part.match(/(\d{3}\s?\d{2})\s+(.+)/);
    if (match) {
      postal_code = match[1].replace(/\s+/g, '');
      city = match[2].trim();
      break;
    }
  }

  return { street, postal_code, city };
}

function score(item, query) {
  const q = String(query || '').toLowerCase().trim();
  const normalizedQuery = normalizeOrgNumber(query);
  const companyName = String(item.companyName || '').toLowerCase();
  const popularName = String(item.companyPopularName || '').toLowerCase();
  const relatedName = String(item.relatedCompanyName || '').toLowerCase();
  const orgNr = normalizeOrgNumber(item.orgNr || '');

  let s = 0;

  if (normalizedQuery && orgNr === normalizedQuery) s += 1000;
  if (companyName === q) s += 500;
  if (popularName === q) s += 350;
  if (relatedName === q) s += 150;
  if (companyName.includes(q)) s += 200;
  if (popularName.includes(q)) s += 140;
  if (relatedName.includes(q)) s += 60;
  if (item.companyCode === 0) s += 20;

  return s;
}

function mapSuggestion(item, query) {
  const { street, postal_code, city } = parseAddress(item.address);
  const orgNumber = formatOrgNumber(item.orgNr || '');
  const companyName = item.companyName || item.companyPopularName || item.relatedCompanyName || query;

  return {
    company_name: companyName,
    org_number: orgNumber,
    vat_number: deriveVatNumber(item.orgNr || ''),
    address: street,
    postal_code: item.postNr || postal_code,
    city: item.postOrt || city,
    country: 'Sverige',
    email: '',
    phone: '',
    label: `${companyName}${orgNumber ? ` · ${orgNumber}` : ''}`,
    description: [street, (item.postNr || postal_code) && (item.postOrt || city) ? `${item.postNr || postal_code} ${item.postOrt || city}` : '', item.sniText || '']
      .filter(Boolean)
      .join(' • '),
    metadata: {
      company_url: item.companyUrl || '',
      work_sites_url: item.workSitesUrl || '',
      related_company_url: item.relatedCompanyUrl || '',
      related_company_name: item.relatedCompanyName || '',
      responsible_count: item.responsibleCount ?? null,
      employees: item.antalAnstallda ?? null,
      active_person_name: item.activeInCompany?.name || '',
      active_person_pnr: item.activeInCompany?.pNr || '',
      sni_text: item.sniText || '',
      company_code: item.companyCode ?? null,
    }
  };
}

export async function searchLocalCompany(orgId, lookupQuery) {
  const search = `%${lookupQuery.toLowerCase()}%`;

  const res = await query(
    `SELECT data FROM customers WHERE organization_id=$1 AND (lower(COALESCE(data->>'company_name','')) LIKE $2 OR lower(COALESCE(data->>'org_number','')) LIKE $2) LIMIT 1`,
    [orgId, search]
  );

  if (res.rows[0]) return res.rows[0].data;
  return null;
}

export async function searchLocalCompanies(orgId, lookupQuery, limit = 8) {
  const search = `%${lookupQuery.toLowerCase()}%`;

  const res = await query(
    `SELECT data
     FROM customers
     WHERE organization_id=$1
       AND (
         lower(COALESCE(data->>'company_name','')) LIKE $2
         OR lower(COALESCE(data->>'org_number','')) LIKE $2
       )
     ORDER BY COALESCE(data->>'company_name','') ASC
     LIMIT $3`,
    [orgId, search, limit]
  );

  return res.rows.map((row) => ({
    ...row.data,
    label: `${row.data.company_name || ''}${row.data.org_number ? ` · ${row.data.org_number}` : ''}`,
    description: [row.data.address, row.data.postal_code && row.data.city ? `${row.data.postal_code} ${row.data.city}` : '']
      .filter(Boolean)
      .join(' • '),
    source: 'local'
  }));
}

export async function searchExternalCompanies(query, limit = 8) {
  try {
    const res = await axios.get(
      `https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'PostmanRuntime/7.49.1',
          'Accept': '*/*',
          'Accept-Language': 'gzip, deflate, br',
          'Accept-Encoding': 'https://www.bolagsfakta.se/',
          'Origin': 'https://www.bolagsfakta.se',
          'Connection': 'keep-alive'
        },
        timeout: 5000
      }
    );

    const items = Array.isArray(res.data?.searchResultItems) ? res.data.searchResultItems : [];
    if (!items.length) return [];

    return items
      .map((item) => ({ item, score: score(item, query) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item }) => ({ ...mapSuggestion(item, query), source: 'external' }));
  } catch (err) {
    console.log('❌ Bolagsfakta ERROR:', err.response?.status, err.message);
    return [];
  }
}

export async function searchExternalCompany(query) {
  const suggestions = await searchExternalCompanies(query, 1);
  return suggestions[0] || null;
}
