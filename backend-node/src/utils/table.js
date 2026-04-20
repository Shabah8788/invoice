const TABLES = {
  customers: 'customers',
  invoices: 'invoices',
  products: 'products',
  company_profiles: 'company_profiles'
};

export function getTable(name) {
  if (!TABLES[name]) throw new Error('Invalid table');
  return TABLES[name];
}
