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

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const joined = value.filter(Boolean).join(' ').trim();
      if (joined) return joined;
      continue;
    }
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function looksLikeCompanyObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj).map((k) => k.toLowerCase());
  return keys.some((k) =>
    [
      'namn', 'name', 'company_name', 'företagsnamn', 'foretagsnamn',
      'organisationsnummer', 'orgnr', 'org_number', 'postadress', 'postnr', 'postort'
    ].includes(k)
  );
}

function extractDeepCandidates(obj, results = []) {
  if (!obj) return results;

  if (Array.isArray(obj)) {
    for (const item of obj) extractDeepCandidates(item, results);
    return results;
  }

  if (typeof obj === 'object') {
    if (looksLikeCompanyObject(obj)) results.push(obj);
    for (const value of Object.values(obj)) {
      if (value && typeof value === 'object') extractDeepCandidates(value, results);
    }
  }

  return results;
}

function parseHtmlFallback(html, query) {
  if (!html || typeof html !== 'string') return null;

  const normalizedQuery = String(query || '').trim();
  const orgMatch = html.match(/\b\d{6}[- ]?\d{4}\b/);
  const postCodeCityMatch = html.match(/\b(\d{3}\s?\d{2})\s+([A-ZÅÄÖa-zåäö][A-ZÅÄÖa-zåäö\- ]{1,})/);

  let companyName = '';
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch?.[1]) {
    companyName = titleMatch[1]
      .replace(/\s*\|.*$/,'')
      .replace(/\s*-\s*Bolagsfakta.*$/i,'')
      .trim();
  }

  if (!companyName) {
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match?.[1]) companyName = h1Match[1].replace(/<[^>]+>/g, '').trim();
  }

  const org = orgMatch ? orgMatch[0] : '';
  const postalCode = postCodeCityMatch ? postCodeCityMatch[1].replace(/\s+/g, '') : '';
  const city = postCodeCityMatch ? postCodeCityMatch[2].trim() : '';

  if (!companyName && !org) return null;

  return {
    company_name: companyName || normalizedQuery,
    org_number: formatOrgNumber(org),
    vat_number: deriveVatNumber(org),
    address: '',
    postal_code: postalCode,
    city,
    country: 'Sverige',
    email: '',
    phone: '',
  };
}

export function mapCompanyRecord(record, fallbackQuery = '') {
  if (!record) return null;

  const orgNumber = firstNonEmpty(
    record.org_number,
    record.organization_number,
    record.organizationNumber,
    record.organisationsnummer,
    record.organisationsnr,
    record.orgnr,
    record.registration_number,
    record.registrationNumber,
    record.id
  );

  const companyName = firstNonEmpty(
    record.company_name,
    record.companyName,
    record.name,
    record.namn,
    record.foretagsnamn,
    record.företagsnamn,
    record.title,
    fallbackQuery
  );

  const address = firstNonEmpty(
    record.address,
    record.street,
    record.street_address,
    record.streetAddress,
    record.postadress,
    record.besoksadress,
    record.besöksadress,
    record.adress,
    record.address1,
    record.address_1
  );

  const postalCode = firstNonEmpty(
    record.postal_code,
    record.zip,
    record.zip_code,
    record.zipCode,
    record.postnummer,
    record.postnr,
    record.zipcode
  );

  const city = firstNonEmpty(
    record.city,
    record.locality,
    record.town,
    record.postort,
    record.ort
  );

  const country = firstNonEmpty(
    record.country,
    record.country_name,
    record.countryName,
    'Sverige'
  );

  const email = firstNonEmpty(record.email, record.epost, record['e-post']);
  const phone = firstNonEmpty(record.phone, record.telephone, record.phone_number, record.phoneNumber, record.telefon);
  const vatNumber = firstNonEmpty(record.vat_number, record.vatNumber, record.momsregistreringsnummer, deriveVatNumber(orgNumber));

  return {
    company_name: companyName,
    org_number: formatOrgNumber(orgNumber),
    vat_number: vatNumber,
    address,
    postal_code: postalCode,
    city,
    country,
    email,
    phone,
  };
}

export async function searchLocalCompany(orgId, lookupQuery) {
  const search = `%${lookupQuery.toLowerCase()}%`;

  const customers = await query(
    `SELECT data FROM customers WHERE organization_id=$1 AND (lower(COALESCE(data->>'company_name','')) LIKE $2 OR lower(COALESCE(data->>'org_number','')) LIKE $2) LIMIT 1`,
    [orgId, search]
  );

  if (customers.rows[0]) return customers.rows[0].data;

  const profiles = await query(
    `SELECT data FROM company_profiles WHERE organization_id=$1 AND (lower(COALESCE(data->>'company_name','')) LIKE $2 OR lower(COALESCE(data->>'org_number','')) LIKE $2) LIMIT 1`,
    [orgId, search]
  );

  if (profiles.rows[0]) return profiles.rows[0].data;

  return null;
}

export async function searchExternalCompany(query) {
  const url = `https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept': 'application/json,text/plain,text/html,*/*',
      'Referer': 'https://www.bolagsfakta.se/',
      'Origin': 'https://www.bolagsfakta.se'
    }
  });

  if (!res.ok) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[company-lookup] non-200 from Bolagsfakta:', res.status);
    }
    return null;
  }

  const raw = await res.text();

  if (process.env.NODE_ENV !== 'production') {
    console.log('[company-lookup] first 500 chars:', raw.slice(0, 500));
  }

  try {
    const json = JSON.parse(raw);
    const candidates = extractDeepCandidates(json);
    if (candidates.length) {
      return mapCompanyRecord(candidates[0], query);
    }
  } catch {
    // fall through to html/text parsing
  }

  return parseHtmlFallback(raw, query);
}
