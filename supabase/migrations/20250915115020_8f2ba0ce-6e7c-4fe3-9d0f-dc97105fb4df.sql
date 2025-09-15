-- Clean up all demo data from the system (avoiding views)
-- Keep only the main admin user for system access

-- Delete from tables only (not views)
DELETE FROM public.kpi_values;
DELETE FROM public.weekly_targets;
DELETE FROM public.kpis;
DELETE FROM public.drivers;
DELETE FROM public.vehicles;
DELETE FROM public.driver_availability;
DELETE FROM public.vehicle_maintenance;
DELETE FROM public.trip_templates;

-- Delete demo user-related data (keep admin)
DELETE FROM public.notifications WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
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

DELETE FROM public.weekly_tasks WHERE employee_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

DELETE FROM public.employee_profiles WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

-- Clean up old security events
DELETE FROM public.security_events WHERE created_at < (now() - interval '7 days');

-- Delete demo user roles (keep admin role)
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT p.id FROM public.profiles p 
  WHERE p.email != 'itofficernafgem@gmail.com'
);

-- Delete demo profiles (keep admin profile)
DELETE FROM public.profiles WHERE email != 'itofficernafgem@gmail.com';