import { pgTable, varchar, text, jsonb } from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  subscription: text("subscription").default("free"),
});

export const organizationMembers = pgTable("organization_members", {
  userId: varchar("user_id").notNull(),
  organizationId: varchar("organization_id").notNull(),
  role: text("role").default("admin"),
});

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
