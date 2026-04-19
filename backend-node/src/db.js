import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/invoice_app'
});

export const query = (text, params) => pool.query(text, params);

export async function initDb() {
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
      company_name TEXT,
      next_invoice_number INT DEFAULT 1001,
      logo_url TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT,
      price NUMERIC,
      vat_rate INT
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      invoice_number TEXT,
      status TEXT,
      customer_name TEXT,
      customer_email TEXT,
      subtotal NUMERIC,
      total NUMERIC,
      vat_breakdown JSONB,
      lines JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}
