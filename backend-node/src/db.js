import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || null;

const pool = new Pool(connectionString
  ? { connectionString }
  : {
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'invoice_app',
      password: process.env.PGPASSWORD || 'postgres',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    }
);

export const query = (text, params) => pool.query(text, params);

async function getColumns(tableName) {
  const result = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

async function ensureJsonDataColumn(tableName) {
  const columns = await getColumns(tableName);

  if (!columns.includes('data')) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN data JSONB DEFAULT '{}'::jsonb`);
  }

  const sourceColumns = columns.filter(
    (column) => !['id', 'organization_id', 'data'].includes(column)
  );

  if (sourceColumns.length === 0) {
    return;
  }

  const jsonPairs = sourceColumns
    .map((column) => `'${column}', to_jsonb(${tableName}.${column})`)
    .join(', ');

  await pool.query(`
    UPDATE ${tableName}
    SET data = COALESCE(data, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(${jsonPairs}))
    WHERE data IS NULL OR data = '{}'::jsonb
  `);
}

export async function initDb() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('\n❌ DATABASE CONNECTION FAILED');
    console.error(err.message);
    process.exit(1);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      subscription TEXT DEFAULT 'free'
    );

    CREATE TABLE IF NOT EXISTS organization_members (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'admin',
      PRIMARY KEY(user_id, organization_id)
    );

    CREATE TABLE IF NOT EXISTS company_profiles (
      id UUID PRIMARY KEY,
      organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
      data JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      data JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      data JSONB DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      data JSONB DEFAULT '{}'::jsonb
    );
  `);

  await ensureJsonDataColumn('company_profiles');
  await ensureJsonDataColumn('customers');
  await ensureJsonDataColumn('products');
  await ensureJsonDataColumn('invoices');
}
