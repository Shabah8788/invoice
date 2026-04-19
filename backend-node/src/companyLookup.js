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
  return `NO${digits}MVA`;
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
    record.organisasjonsnummer ||
    '';

  const companyName =
    record.company_name ||
    record.name ||
    record.companyName ||
    record.legal_name ||
    record.legalName ||
    record.navn ||
    fallbackQuery ||
    '';

  const address =
    record.address ||
    record.street ||
    record.street_address ||
    record.streetAddress ||
    record.visiting_address ||
    record.visitingAddress ||
    record.forretningsadresse?.adresse?.join(' ') ||
    '';

  const postalCode =
    record.postal_code ||
    record.zip ||
    record.zip_code ||
    record.zipCode ||
    record.postcode ||
    record.postCode ||
    record.forretningsadresse?.postnummer ||
    '';

  const city =
    record.city ||
    record.locality ||
    record.town ||
    record.forretningsadresse?.poststed ||
    '';

  const country =
    record.country ||
    record.country_name ||
    record.countryName ||
    record.forretningsadresse?.land ||
    'Norge';

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

  return null;
}

export async function searchExternalCompany(lookupQuery) {
  const normalized = normalizeOrgNumber(lookupQuery);
  const isOrgNumber = normalized.length === 9 || normalized.length === 10;

  let url;
  if (isOrgNumber) {
    url = `https://data.brreg.no/enhetsregisteret/api/enheter/${normalized}`;
  } else {
    url = `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(lookupQuery)}`;
  }

  const response = await fetch(url, {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) return null;

  const payload = await response.json();
  const record = isOrgNumber ? payload : payload?._embedded?.enheter?.[0];

  return mapCompanyRecord(record, lookupQuery);
}
