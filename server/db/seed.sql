-- Fixed stub admin (local dev). Password: admin123 when password_hash is set via seed.
-- UUID: 00000000-0000-4000-8000-000000000001

INSERT INTO public.profiles (id, email, full_name, project, title, password_hash)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'admin@local.dev',
  'NAFGEM Admin',
  'HQ',
  'System Administrator',
  '$2b$10$DwgBBvufQq7hqMcSNgCObuIgxtOUxh32zguuZtbz/NeH5pmY0y/Oq'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  project = EXCLUDED.project,
  title = EXCLUDED.title,
  password_hash = COALESCE(public.profiles.password_hash, EXCLUDED.password_hash),
  updated_at = now();

INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'super_admin',
  '00000000-0000-4000-8000-000000000001'
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

INSERT INTO public.leave_balances (user_id, leave_type, year, total_entitlement, used_days)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'annual', EXTRACT(YEAR FROM now())::INTEGER, 21, 0),
  ('00000000-0000-4000-8000-000000000001', 'sick', EXTRACT(YEAR FROM now())::INTEGER, 10, 0)
ON CONFLICT (user_id, leave_type, year) DO NOTHING;
