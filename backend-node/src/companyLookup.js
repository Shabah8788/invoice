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

  const parts = address.split(',').map(p => p.trim());

  const street = parts[0] || '';
  let postal_code = '';
  let city = '';

  for (let p of parts) {
    const match = p.match(/(\d{3}\s?\d{2})\s+(.+)/);
    if (match) {
      postal_code = match[1].replace(/\s+/g, '');
      city = match[2];
    }
  }

  return { street, postal_code, city };
}

function score(item, query) {
  const q = query.toLowerCase();
  let s = 0;

  if (item.orgNr?.includes(q)) s += 1000;
  if (item.companyName?.toLowerCase() === q) s += 500;
  if (item.companyName?.toLowerCase().includes(q)) s += 200;
  if (item.relatedCompanyName?.toLowerCase().includes(q)) s += 100;

  return s;
}

function pickBest(items, query) {
  return items
    .map(i => ({ i, s: score(i, query) }))
    .sort((a, b) => b.s - a.s)[0]?.i;
}

function map(item, query) {
  const { street, postal_code, city } = parseAddress(item.address);

  return {
    company_name: item.companyName || item.relatedCompanyName || query,
    org_number: formatOrgNumber(item.orgNr),
    vat_number: deriveVatNumber(item.orgNr),
    address: street,
    postal_code,
    city,
    country: 'Sverige',
    email: '',
    phone: ''
  };
}

export async function searchLocalCompany(orgId, lookupQuery) {
  const search = `%${lookupQuery.toLowerCase()}%`;

  const res = await query(
    `SELECT data FROM customers WHERE organization_id=$1 AND (lower(data->>'company_name') LIKE $2 OR lower(data->>'org_number') LIKE $2) LIMIT 1`,
    [orgId, search]
  );

  if (res.rows[0]) return res.rows[0].data;
  return null;
}


export async function searchExternalCompany(query) {
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

    const json = res.data;

    if (!json?.searchResultItems?.length) return null;

    const best = json.searchResultItems[0]; // första räcker

    return {
      company_name: best.companyName,
      org_number: best.orgNr,
      vat_number: `SE${best.orgNr.replace('-', '')}01`,
      address: best.address,
      postal_code: best.postNr,
      city: best.postOrt || '',
      country: 'Sverige',
      email: '',
      phone: ''
    };

  } catch (err) {
    console.log("❌ Bolagsfakta ERROR:", err.response?.status, err.message);
    return null;
  }
}