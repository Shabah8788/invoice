import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || null;

const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        user: process.env.PGUSER || "postgres",
        host: process.env.PGHOST || "localhost",
        database: process.env.PGDATABASE || "invoice_app",
        password: process.env.PGPASSWORD || "postgres",
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      }
);

export const db = drizzle(pool, { schema });
export { pool };
