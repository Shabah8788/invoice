import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { db } from './db.drizzle.js';
import { users, organizations, organizationMembers, customers } from './schema.js';
import { eq } from 'drizzle-orm';
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

async function listCustomers(orgId) {
  const rows = await db.select().from(customers).where(eq(customers.organizationId, orgId));
  return rows.map(x => ({ id: x.id, ...x.data }));
}

async function createCustomer(orgId, body) {
  const id = uuid();
  await db.insert(customers).values({ id, organizationId: orgId, data: body });
  return { id };
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const userId = uuid();
  const orgId = uuid();

  await db.insert(users).values({ id: userId, email, passwordHash: hash });
  await db.insert(organizations).values({ id: orgId, name: 'My Company' });
  await db.insert(organizationMembers).values({ userId, organizationId: orgId });

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

  const org = await db.select().from(organizationMembers).where(eq(organizationMembers.userId, user.id));
  const orgId = org[0].organizationId;

  const token = jwt.sign({ userId: user.id, orgId }, SECRET);
  res.json({ token });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await db.select().from(users).where(eq(users.id, req.user.userId));
  res.json(user[0]);
});

app.get('/api/customers', auth, async (req, res) => res.json(await listCustomers(req.user.orgId)));
app.post('/api/customers', auth, async (req, res) => res.json(await createCustomer(req.user.orgId, req.body)));

app.post('/api/integrations/company-autocomplete', auth, async (req, res) => {
  const queryStr = String(req.body?.query || '').trim();
  if (!queryStr || queryStr.length < 2) return res.json({ items: [] });

  const local = await searchLocalCompanies(req.user.orgId, queryStr);
  const external = await searchExternalCompanies(queryStr);

  const items = [...local, ...external].slice(0, 8);

  res.json({ items });
});

app.post('/api/integrations/company-lookup', auth, async (req, res) => {
  const queryStr = String(req.body?.query || '').trim();
  if (!queryStr) return res.status(400).json({ error: 'Query required' });

  const local = await searchLocalCompany(req.user.orgId, queryStr);
  if (local) return res.json({ found: true, source: 'local', company: local });

  const external = await searchExternalCompany(queryStr);
  if (external) return res.json({ found: true, source: 'external', company: external });

  return res.json({ found: false });
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
