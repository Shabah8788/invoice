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

function extractFirstRecord(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload.results)) return payload.results[0] || null;
  if (Array.isArray(payload.data)) return payload.data[0] || null;
  if (Array.isArray(payload.items)) return payload.items[0] || null;
  if (payload.company) return payload.company;
  return payload;
}

export function mapCompanyRecord(record, fallbackQuery = '') {
  if (!record) return null;

  const orgNumber =
    record.org_number ||
    record.organization_number ||
    record.organizationNumber ||
    record.orgNo ||
    record.registration_number ||
    record.registrationNumber ||
    '';

  const companyName =
    record.company_name ||
    record.name ||
    record.companyName ||
    record.legal_name ||
    record.legalName ||
    fallbackQuery ||
    '';

  const address =
    record.address ||
    record.street ||
    record.street_address ||
    record.streetAddress ||
    record.visiting_address ||
    record.visitingAddress ||
    '';

  const postalCode =
    record.postal_code ||
    record.zip ||
    record.zip_code ||
    record.zipCode ||
    record.postcode ||
    record.postCode ||
    '';

  const city = record.city || record.locality || record.town || '';
  const country = record.country || record.country_name || record.countryName || 'Sverige';
  const email = record.email || '';
  const phone = record.phone || record.telephone || record.phone_number || record.phoneNumber || '';
  const vatNumber = record.vat_number || record.vatNumber || deriveVatNumber(orgNumber);

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
    `SELECT data
     FROM customers
     WHERE organization_id = $1
       AND (
         lower(COALESCE(data->>'company_name', '')) LIKE $2
         OR lower(COALESCE(data->>'org_number', '')) LIKE $2
       )
     LIMIT 1`,
    [orgId, search]
  );

  if (customers.rows[0]) {
    return mapCompanyRecord(customers.rows[0].data, lookupQuery);
  }

  const profiles = await query(
    `SELECT data
     FROM company_profiles
     WHERE organization_id = $1
       AND (
         lower(COALESCE(data->>'company_name', '')) LIKE $2
         OR lower(COALESCE(data->>'org_number', '')) LIKE $2
       )
     LIMIT 1`,
    [orgId, search]
  );

  if (profiles.rows[0]) {
    return mapCompanyRecord(profiles.rows[0].data, lookupQuery);
  }

  const normalized = normalizeOrgNumber(lookupQuery);
  if (normalized.length === 10) {
    return {
      company_name: '',
      org_number: formatOrgNumber(normalized),
      vat_number: deriveVatNumber(normalized),
      address: '',
      postal_code: '',
      city: '',
      country: 'Sverige',
      email: '',
      phone: '',
    };
  }

  return null;
}

export async function searchExternalCompany(lookupQuery) {
  const apiUrl = process.env.COMPANY_LOOKUP_API_URL;
  if (!apiUrl) return null;

  const url = new URL(apiUrl);
  url.searchParams.set('q', lookupQuery);
  url.searchParams.set('query', lookupQuery);
  url.searchParams.set('search', lookupQuery);
  url.searchParams.set('orgNumber', normalizeOrgNumber(lookupQuery));

  const headers = { Accept: 'application/json' };
  if (process.env.COMPANY_LOOKUP_API_KEY) {
    const headerName = process.env.COMPANY_LOOKUP_API_KEY_HEADER || 'Authorization';
    headers[headerName] = headerName.toLowerCase() === 'authorization'
      ? `Bearer ${process.env.COMPANY_LOOKUP_API_KEY}`
      : process.env.COMPANY_LOOKUP_API_KEY;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) return null;

  const payload = await response.json();
  return mapCompanyRecord(extractFirstRecord(payload), lookupQuery);
}
