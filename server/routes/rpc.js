import { Router } from 'express';

export function createRpcRouter(pool, stubUserId) {
  const router = Router();

  router.post('/admin_assign_role', async (req, res) => {
    try {
      const { target_user_id, new_role, reason } = req.body || {};
      if (!target_user_id || !new_role) {
        return res.status(400).json({ error: 'target_user_id and new_role required' });
      }

      const existing = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [target_user_id]
      );
      const oldRole = existing.rows[0]?.role || null;

      await pool.query(
        `INSERT INTO user_roles (user_id, role, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, assigned_by = EXCLUDED.assigned_by, assigned_at = now()`,
        [target_user_id, new_role, stubUserId]
      );

      await pool.query(
        `INSERT INTO role_audit_log (user_id, changed_by, action, old_role, new_role, reason)
         VALUES ($1, $2, 'assign', $3, $4, $5)`,
        [target_user_id, stubUserId, oldRole, new_role, reason || null]
      );

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/admin_create_employee_profile', async (req, res) => {
    try {
      const payload = req.body || {};
      const { rows } = await pool.query(
        `INSERT INTO employee_profiles (
          user_id, created_by, employee_id, name_full, designation, place_of_work,
          date_of_appointment, date_of_birth, place_of_birth, nationality, national_id,
          tin_no, religion, marital_status, contact_address, mobile_phones,
          father_name, father_nationality, father_place_of_birth,
          mother_name, mother_nationality, mother_place_of_birth,
          spouse_name, spouse_contacts, next_of_kin, children, education, projects,
          passport_photo_url, terms_of_service, user_role, status,
          declaration_text, declaration_signed_by, declaration_signed_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35
        ) RETURNING *`,
        [
          payload.user_id || null,
          stubUserId,
          payload.employee_id,
          payload.name_full,
          payload.designation,
          payload.place_of_work,
          payload.date_of_appointment,
          payload.date_of_birth,
          payload.place_of_birth,
          payload.nationality,
          payload.national_id,
          payload.tin_no || null,
          payload.religion || null,
          payload.marital_status,
          payload.contact_address,
          payload.mobile_phones || [],
          payload.father_name,
          payload.father_nationality,
          payload.father_place_of_birth,
          payload.mother_name,
          payload.mother_nationality,
          payload.mother_place_of_birth,
          payload.spouse_name || null,
          payload.spouse_contacts || null,
          JSON.stringify(payload.next_of_kin || {}),
          JSON.stringify(payload.children || null),
          JSON.stringify(payload.education || null),
          JSON.stringify(payload.projects || null),
          payload.passport_photo_url || null,
          payload.terms_of_service || '',
          payload.user_role || 'employee',
          payload.status || 'active',
          payload.declaration_text || '',
          payload.declaration_signed_by || 'Local Admin',
          payload.declaration_signed_at || new Date().toISOString(),
        ]
      );
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/admin_get_available_users', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT p.id, p.email, p.full_name, p.title, p.project, ur.role
         FROM profiles p
         LEFT JOIN user_roles ur ON ur.user_id = p.id
         LEFT JOIN employee_profiles ep ON ep.user_id = p.id
         WHERE ep.id IS NULL
         ORDER BY p.full_name NULLS LAST`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/debug_user_role', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT p.id AS user_id, p.email, ur.role
         FROM profiles p
         LEFT JOIN user_roles ur ON ur.user_id = p.id
         WHERE p.id = $1`,
        [stubUserId]
      );
      res.json(rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/create_default_exit_checklist', async (_req, res) => {
    res.json({ deprecated: true, items: [] });
  });

  router.post('/has_role', async (req, res) => {
    try {
      const userId = req.body?._user_id || stubUserId;
      const role = req.body?.role;
      const { rows } = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [userId]
      );
      const current = rows[0]?.role;
      const rank = {
        field_officer: 1,
        employee: 2,
        manager: 3,
        hr_admin: 4,
        hr: 4,
        super_admin: 5,
        admin: 5,
      };
      res.json(Boolean(current && rank[current] >= (rank[role] || 0)));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/get_user_role', async (req, res) => {
    try {
      const userId = req.body?.user_id || stubUserId;
      const { rows } = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [userId]
      );
      res.json(rows[0]?.role || 'employee');
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/get_current_user_role', async (_req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT role FROM user_roles WHERE user_id = $1',
        [stubUserId]
      );
      res.json(rows[0]?.role || 'admin');
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fallback for unused security helpers
  router.post('/:name', (req, res) => {
    res.json({ ok: true, rpc: req.params.name, stub: true });
  });

  return router;
}
