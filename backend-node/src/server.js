import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { query, initDb } from './db.js';
import { searchLocalCompany, searchExternalCompany, searchExternalCompanies, searchLocalCompanies } from './companyLookup.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const SECRET = process.env.JWT_SECRET || 'dev_secret';
const PORT = Number(process.env.PORT || 4000);

await initDb();

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

async function list(table, orgId) {
  const r = await query(`SELECT id,data FROM ${table} WHERE organization_id=$1`, [orgId]);
  return r.rows.map(x => ({ id: x.id, ...x.data }));
}

async function create(table, orgId, body) {
  const id = uuid();
  await query(`INSERT INTO ${table}(id,organization_id,data) VALUES($1,$2,$3)`, [id, orgId, body]);
  return { id };
}

async function update(table, id, orgId, body) {
  await query(`UPDATE ${table} SET data=$1 WHERE id=$2 AND organization_id=$3`, [body, id, orgId]);
}

async function remove(table, id, orgId) {
  await query(`DELETE FROM ${table} WHERE id=$1 AND organization_id=$2`, [id, orgId]);
}

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const userId = uuid();
  const orgId = uuid();

  await query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)', [userId, email, hash]);
  await query('INSERT INTO organizations(id,name) VALUES($1,$2)', [orgId, 'My Company']);
  await query('INSERT INTO organization_members(user_id,organization_id) VALUES($1,$2)', [userId, orgId]);

  const token = jwt.sign({ userId, orgId }, SECRET);
  res.json({ token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await query('SELECT * FROM users WHERE email=$1', [email]);
  const user = result.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

  const org = await query('SELECT organization_id FROM organization_members WHERE user_id=$1', [user.id]);
  const orgId = org.rows[0].organization_id;

  const token = jwt.sign({ userId: user.id, orgId }, SECRET);
  res.json({ token });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const user = await query('SELECT id,email,subscription FROM users WHERE id=$1', [req.user.userId]);
  res.json(user.rows[0]);
});

app.get('/api/customers', auth, async (req, res) => res.json(await list('customers', req.user.orgId)));
app.post('/api/customers', auth, async (req, res) => res.json(await create('customers', req.user.orgId, req.body)));
app.put('/api/customers/:id', auth, async (req, res) => { await update('customers', req.params.id, req.user.orgId, req.body); res.json({ ok:true }); });
app.delete('/api/customers/:id', auth, async (req, res) => { await remove('customers', req.params.id, req.user.orgId); res.json({ ok:true }); });

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
