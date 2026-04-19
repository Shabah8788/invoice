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

function pickFirst(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload.results)) return payload.results[0] || null;
  if (Array.isArray(payload.data)) return payload.data[0] || null;
  if (Array.isArray(payload.items)) return payload.items[0] || null;
  if (Array.isArray(payload.companies)) return payload.companies[0] || null;
  if (Array.isArray(payload.hits)) return payload.hits[0] || null;
  return payload;
}

export function mapCompanyRecord(record, fallbackQuery = '') {
  if (!record) return null;

  const orgNumber =
    record.org_number ||
    record.organization_number ||
    record.organizationNumber ||
    record.organisationsnummer ||
    record.organisationsnr ||
    record.orgnr ||
    record.registration_number ||
    record.registrationNumber ||
    '';

  const streetAddress =
    record.address ||
    record.street ||
    record.street_address ||
    record.streetAddress ||
    record.besoksadress ||
    record.besöksadress ||
    record.postadress ||
    '';

  const postalCode =
    record.postal_code ||
    record.zip ||
    record.zip_code ||
    record.zipCode ||
    record.postnummer ||
    record.postnr ||
    '';

  const city =
    record.city ||
    record.locality ||
    record.town ||
    record.postort ||
    '';

  const country =
    record.country ||
    record.country_name ||
    record.countryName ||
    'Sverige';

  const companyName =
    record.company_name ||
    record.name ||
    record.companyName ||
    record.foretagsnamn ||
    record.företagsnamn ||
    record.namn ||
    fallbackQuery ||
    '';

  const vatNumber =
    record.vat_number ||
    record.vatNumber ||
    record.momsregistreringsnummer ||
    deriveVatNumber(orgNumber);

  const addressParts = [streetAddress, postalCode && city ? `${postalCode} ${city}` : '']
    .filter(Boolean)
    .join(', ');

  return {
    company_name: companyName,
    org_number: formatOrgNumber(orgNumber),
    vat_number: vatNumber,
    address: streetAddress || addressParts,
    postal_code: postalCode,
    city,
    country,
    email: record.email || '',
    phone: record.phone || record.telephone || record.phone_number || record.phoneNumber || '',
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

  return null;
}

export async function searchExternalCompany(lookupQuery) {
  const url = `https://www.bolagsfakta.se/api/search?what=${encodeURIComponent(lookupQuery)}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const record = pickFirst(payload);
  return mapCompanyRecord(record, lookupQuery);
}
