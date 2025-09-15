-- Clean up all demo data from the system
-- Keep only the main admin user for system access

-- 1. Delete demo operational data
DELETE FROM public.notifications WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.weekly_tasks WHERE employee_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.task_submissions WHERE weekly_task_id NOT IN (
  SELECT id FROM public.weekly_tasks
);

DELETE FROM public.task_evaluations WHERE task_submission_id NOT IN (
  SELECT id FROM public.task_submissions
);

DELETE FROM public.task_conversations WHERE sender_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.conversation_participants WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.timesheet_entries WHERE timesheet_id IN (
  SELECT t.id FROM public.timesheets t
  JOIN public.profiles p ON t.employee_id = p.id
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.timesheet_attachments WHERE timesheet_id IN (
  SELECT t.id FROM public.timesheets t
  JOIN public.profiles p ON t.employee_id = p.id
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.timesheets WHERE employee_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.trip_requests WHERE requester_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.leave_requests WHERE requester_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.leave_balances WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.exit_requests WHERE employee_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

-- 2. Delete demo KPI and project data
DELETE FROM public.kpi_values;
DELETE FROM public.kpi_gaps;
DELETE FROM public.weekly_targets;
DELETE FROM public.weekly_target_progress;
DELETE FROM public.kpis;

-- 3. Delete demo vehicle and driver data
DELETE FROM public.driver_availability;
DELETE FROM public.vehicle_maintenance;
DELETE FROM public.trip_templates;
DELETE FROM public.drivers;
DELETE FROM public.vehicles;

-- 4. Delete demo employee profiles (keep admin if exists)
DELETE FROM public.employee_profiles WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

-- 5. Clean up security events (keep recent admin events)
DELETE FROM public.security_events WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
) OR created_at < (now() - interval '7 days');

-- 6. Delete demo user roles (keep admin role)
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

-- 7. Delete demo profiles (keep admin profile)
DELETE FROM public.profiles WHERE email != 'itofficernafgem@gmail.com';

-- 8. Reset sequences and clean up orphaned data
DELETE FROM public.conversation_participants WHERE conversation_id NOT IN (
  SELECT DISTINCT conversation_id FROM public.task_conversations WHERE conversation_id IS NOT NULL
);