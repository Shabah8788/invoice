import { pgTable, varchar, jsonb } from "drizzle-orm/pg-core";

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id"),
  data: jsonb("data"),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id"),
  data: jsonb("data"),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id"),
  data: jsonb("data"),
});

export const companyProfiles = pgTable("company_profiles", {
  id: varchar("id").primaryKey(),
  organizationId: varchar("organization_id"),
  data: jsonb("data"),
});
