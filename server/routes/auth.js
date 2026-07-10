import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { STUB_USER_ID } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nafgem-hr-dev-secret-change-in-production';
const AUTH_DISABLED = process.env.AUTH_DISABLED === 'true';

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
