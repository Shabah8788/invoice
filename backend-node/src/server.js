import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { query, initDb } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
const SECRET = process.env.JWT_SECRET || 'dev_secret';

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

app.post('/api/auth/register', async (req, res) => {
  const { email, password, organizationName } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const userId = uuid();
  const orgId = uuid();

  await query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)', [userId, email, hash]);
  await query('INSERT INTO organizations(id,name) VALUES($1,$2)', [orgId, organizationName]);
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
  res.json({ ...user.rows[0] });
});

app.get('/api/customers', auth, async (req, res) => {
  const result = await query('SELECT * FROM customers WHERE organization_id=$1', [req.user.orgId]);
  res.json(result.rows);
});

app.post('/api/customers', auth, async (req, res) => {
  const id = uuid();
  await query('INSERT INTO customers(id,organization_id,company_name,email,phone,address) VALUES($1,$2,$3,$4,$5,$6)', [
    id,
    req.user.orgId,
    req.body.company_name,
    req.body.email,
    req.body.phone,
    req.body.address
  ]);
  res.json({ id });
});

app.get('/api/invoices', auth, async (req, res) => {
  const result = await query('SELECT * FROM invoices WHERE organization_id=$1 ORDER BY created_at DESC', [req.user.orgId]);
  res.json(result.rows);
});

app.post('/api/invoices', auth, async (req, res) => {
  const id = uuid();
  await query('INSERT INTO invoices(id,organization_id,invoice_number,status,customer_name,total,lines) VALUES($1,$2,$3,$4,$5,$6,$7)', [
    id,
    req.user.orgId,
    req.body.invoice_number,
    'draft',
    req.body.customer_name,
    req.body.total,
    JSON.stringify(req.body.lines)
  ]);
  res.json({ id });
});

app.post('/api/integrations/send-email', auth, (req, res) => {
  console.log('EMAIL SENT', req.body);
  res.json({ success: true });
});

app.post('/api/integrations/upload', auth, upload.single('file'), (req, res) => {
  res.json({ file_url: `/uploads/${req.file.filename}` });
});

app.listen(4000, () => console.log('Backend running on http://localhost:4000'));
