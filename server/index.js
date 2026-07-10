import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { pool, STUB_USER_ID } from './db.js';
import { createTableRouter } from './routes/table.js';
import { createRpcRouter } from './routes/rpc.js';
import { createAuthRouter, resolveUserId, AUTH_DISABLED } from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number(process.env.PORT || 4000);
const app = express();

const uploadsRoot = path.join(__dirname, 'uploads');
for (const bucket of [
  'profile-photos',
  'education-certificates',
  'field-reports',
]) {
  fs.mkdirSync(path.join(uploadsRoot, bucket), { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsRoot));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, authDisabled: AUTH_DISABLED });
});

app.use('/api/auth', createAuthRouter(pool));

app.get('/api/me', async (req, res) => {
  try {
    const userId = await resolveUserId(req, pool);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { rows } = await pool.query(
      `SELECT p.*, ur.role
       FROM profiles p
       LEFT JOIN user_roles ur ON ur.user_id = p.id
       WHERE p.id = $1`,
      [userId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    const profile = rows[0];
    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        user_metadata: {
          full_name: profile.full_name,
          project: profile.project,
          title: profile.title,
        },
      },
      profile,
      role: profile.role || 'employee',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(async (req, res, next) => {
  req.userId = await resolveUserId(req, pool);
  req.userRole = null;
  if (req.userId) {
    const { rows } = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1',
      [req.userId]
    );
    req.userRole = rows[0]?.role || 'employee';
  }
  next();
});

app.use('/api/db', createTableRouter(pool));
app.use('/api/rpc', createRpcRouter(pool, STUB_USER_ID));

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const bucket = req.params.bucket || 'misc';
    const dest = path.join(uploadsRoot, bucket);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.post('/api/storage/:bucket', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File exceeds 5MB limit' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const bucket = req.params.bucket;
    const publicBase = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${publicBase}/uploads/${bucket}/${req.file.filename}`;
    res.json({
      path: req.body.path || req.file.filename,
      fullPath: `${bucket}/${req.file.filename}`,
      publicUrl,
    });
  });
});

app.get('/api/storage/:bucket/*', (req, res) => {
  const bucket = req.params.bucket;
  const filePath = req.params[0];
  const full = path.join(uploadsRoot, bucket, filePath);
  if (!full.startsWith(uploadsRoot) || !fs.existsSync(full)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.sendFile(full);
});

// Production: serve Vite build from /app/dist (same origin as API)
const staticRoot = process.env.SERVE_STATIC === 'true'
  ? path.resolve(__dirname, '../dist')
  : null;
if (staticRoot && fs.existsSync(staticRoot)) {
  app.use(express.static(staticRoot));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(staticRoot, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`NAFGEM HR API listening on http://localhost:${PORT}`);
});
