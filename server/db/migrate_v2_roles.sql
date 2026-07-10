-- Migrate legacy role values (run after migrate_v2_enums.sql)
UPDATE public.user_roles SET role = 'super_admin' WHERE role::text = 'admin';
UPDATE public.user_roles SET role = 'hr_admin' WHERE role::text = 'hr';
