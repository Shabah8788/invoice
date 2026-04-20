import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { db } from './db.drizzle.js';
import { users, organizations, organizationMembers, customers, products, invoices, companyProfiles } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { searchLocalCompany, searchExternalCompany, searchExternalCompanies, searchLocalCompanies } from './companyLookup.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const SECRET = process.env.JWT_SECRET || 'dev_secret';
const PORT = Number(process.env.PORT || 4000);

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function entity(table) {
  return {
    list: async (orgId) => {
      const rows = await db.select().from(table).where(eq(table.organizationId, orgId));
      return rows.map(r => ({ id: r.id, ...(r.data || {}) }));
    },
    create: async (orgId, body) => {
      const id = uuid();
      await db.insert(table).values({ id, organizationId: orgId, data: body });
      return { id, ...body };
    },
    update: async (orgId, id, body) => {
      await db.update(table).set({ data: body }).where(and(eq(table.id, id), eq(table.organizationId, orgId)));
      return { ok: true };
    },
    remove: async (orgId, id) => {
      await db.delete(table).where(and(eq(table.id, id), eq(table.organizationId, orgId)));
      return { ok: true };
    }
  };
}

const customerEntity = entity(customers);
const productEntity = entity(products);
const invoiceEntity = entity(invoices);
const companyProfileEntity = entity(companyProfiles);

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const userId = uuid();
  const orgId = uuid();

  await db.insert(users).values({ id: userId, email, passwordHash: hash });
  await db.insert(organizations).values({ id: orgId, name: 'My Company' });
  await db.insert(organizationMembers).values({ userId, organizationId: orgId, role: 'admin' });

  const token = jwt.sign({ userId, orgId }, SECRET);
  res.json({ token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await db.select().from(users).where(eq(users.email, email));
  const user = result[0];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const memberships = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, user.id));
  const orgId = memberships[0]?.organizationId;

  const token = jwt.sign({ userId: user.id, orgId }, SECRET);
  res.json({ token });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const result = await db.select().from(users).where(eq(users.id, req.user.userId));
  const user = result[0];
  res.json({ id: user.id, email: user.email, subscription: user.subscription || 'free' });
});

app.get('/api/customers', auth, async (req, res) => res.json(await customerEntity.list(req.user.orgId)));
app.post('/api/customers', auth, async (req, res) => res.json(await customerEntity.create(req.user.orgId, req.body)));
app.put('/api/customers/:id', auth, async (req, res) => res.json(await customerEntity.update(req.user.orgId, req.params.id, req.body)));
app.delete('/api/customers/:id', auth, async (req, res) => res.json(await customerEntity.remove(req.user.orgId, req.params.id)));

app.get('/api/products', auth, async (req, res) => res.json(await productEntity.list(req.user.orgId)));
app.post('/api/products', auth, async (req, res) => res.json(await productEntity.create(req.user.orgId, req.body)));
app.put('/api/products/:id', auth, async (req, res) => res.json(await productEntity.update(req.user.orgId, req.params.id, req.body)));
app.delete('/api/products/:id', auth, async (req, res) => res.json(await productEntity.remove(req.user.orgId, req.params.id)));

app.get('/api/invoices', auth, async (req, res) => res.json(await invoiceEntity.list(req.user.orgId)));
app.post('/api/invoices', auth, async (req, res) => res.json(await invoiceEntity.create(req.user.orgId, req.body)));
app.put('/api/invoices/:id', auth, async (req, res) => res.json(await invoiceEntity.update(req.user.orgId, req.params.id, req.body)));
app.delete('/api/invoices/:id', auth, async (req, res) => res.json(await invoiceEntity.remove(req.user.orgId, req.params.id)));

app.get('/api/company-profile', auth, async (req, res) => res.json(await companyProfileEntity.list(req.user.orgId)));
app.post('/api/company-profile', auth, async (req, res) => res.json(await companyProfileEntity.create(req.user.orgId, req.body)));
app.put('/api/company-profile/:id', auth, async (req, res) => res.json(await companyProfileEntity.update(req.user.orgId, req.params.id, req.body)));
app.delete('/api/company-profile/:id', auth, async (req, res) => res.json(await companyProfileEntity.remove(req.user.orgId, req.params.id)));

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
