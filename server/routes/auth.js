import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { STUB_USER_ID } from '../db.js';
import { hasMinimumRole } from '../middleware/access.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nafgem-hr-dev-secret-change-in-production';
const AUTH_DISABLED = process.env.AUTH_DISABLED === 'true';

const ALLOWED_ROLES = new Set([
  'super_admin',
  'hr_admin',
  'manager',
  'employee',
  'field_officer',
]);

export function createAuthRouter(pool) {
  const router = Router();

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const { rows } = await pool.query(
        `SELECT p.*, ur.role
         FROM profiles p
         LEFT JOIN user_roles ur ON ur.user_id = p.id
         WHERE LOWER(p.email) = LOWER($1)`,
        [email]
      );
      const profile = rows[0];
      if (!profile?.password_hash) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, profile.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { sub: profile.id, email: profile.email, role: profile.role || 'employee' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        access_token: token,
        token_type: 'bearer',
        expires_in: 7 * 24 * 3600,
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

  router.get('/me', async (req, res) => {
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

  /** Admin-only: create staff accounts (no public self-registration) */
  router.post('/users', async (req, res) => {
    try {
      const actorId = await resolveUserId(req, pool);
      if (!actorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { rows: actorRows } = await pool.query(
        `SELECT role FROM user_roles WHERE user_id = $1`,
        [actorId]
      );
      const actorRole = actorRows[0]?.role || 'employee';
      if (!hasMinimumRole(actorRole, 'hr_admin')) {
        return res.status(403).json({ error: 'Only HR Admin or Super Admin can create users' });
      }

      const {
        email,
        password,
        full_name,
        project = '',
        title = '',
        role = 'employee',
      } = req.body || {};

      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'full_name, email, and password are required' });
      }
      if (String(password).length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const normalizedRole = String(role).toLowerCase();
      if (!ALLOWED_ROLES.has(normalizedRole)) {
        return res.status(400).json({
          error: `Invalid role. Allowed: ${[...ALLOWED_ROLES].join(', ')}`,
        });
      }
      if (normalizedRole === 'super_admin' && !hasMinimumRole(actorRole, 'super_admin')) {
        return res.status(403).json({ error: 'Only Super Admin can create Super Admin accounts' });
      }

      const existing = await pool.query(
        `SELECT id FROM profiles WHERE LOWER(email) = LOWER($1)`,
        [email]
      );
      if (existing.rows[0]) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }

      const id = randomUUID();
      const password_hash = await bcrypt.hash(String(password), 10);

      const { rows } = await pool.query(
        `INSERT INTO profiles (id, email, full_name, project, title, password_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, project, title, created_at`,
        [id, email.trim(), full_name.trim(), project || '', title || '', password_hash]
      );

      await pool.query(
        `INSERT INTO user_roles (user_id, role, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by`,
        [id, normalizedRole, actorId]
      );

      res.status(201).json({
        user: {
          id: rows[0].id,
          email: rows[0].email,
          user_metadata: {
            full_name: rows[0].full_name,
            project: rows[0].project,
            title: rows[0].title,
          },
        },
        profile: rows[0],
        role: normalizedRole,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

export async function resolveUserId(req, pool) {
  if (AUTH_DISABLED) return STUB_USER_ID;

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub;
  } catch {
    return null;
  }
}

export { AUTH_DISABLED, JWT_SECRET };
