-- Critical Security Fixes: Phase 1 - Role Protection and Data Integrity

-- 1. Enable RLS only on actual tables (skip views)
ALTER TABLE public.weekly_target_progress ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for weekly_target_progress (actual table)
CREATE POLICY "HR and Admin can view all weekly target progress"
ON public.weekly_target_progress
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own weekly target progress"
ON public.weekly_target_progress
FOR SELECT
USING (assigned_to = auth.uid());

-- 3. Fix critical role self-assignment vulnerability
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users cannot modify their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users cannot delete their own roles" ON public.user_roles;

-- Create secure role management policies
CREATE POLICY "Only admins can assign/modify roles"
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own role only"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 4. Add role change validation trigger (CRITICAL SECURITY)
CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from modifying their own roles
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot modify their own roles';
    END IF;
  END IF;
  
  -- Prevent non-admins from assigning admin roles
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role = 'admin' AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;
  
  -- Log critical role changes
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_assignment',
      jsonb_build_object(
        'target_user', NEW.user_id,
        'role_assigned', NEW.role,
        'assigned_by', NEW.assigned_by
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_modification',
      jsonb_build_object(
        'target_user', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      auth.uid(),
      'role_revocation',
      jsonb_build_object(
        'target_user', OLD.user_id,
        'role_revoked', OLD.role
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create the trigger
DROP TRIGGER IF EXISTS validate_role_changes_trigger ON public.user_roles;
CREATE TRIGGER validate_role_changes_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_changes();

-- 5. Add data integrity constraints
ALTER TABLE public.kpi_values
ADD CONSTRAINT check_actual_value_positive 
CHECK (actual_value >= 0);

ALTER TABLE public.weekly_targets
ADD CONSTRAINT check_target_value_positive 
CHECK (target_value >= 0);

ALTER TABLE public.timesheet_entries
ADD CONSTRAINT check_hours_worked_valid 
CHECK (hours_worked >= 0 AND hours_worked <= 24);

-- 6. Secure database functions by setting explicit search_path (SECURITY HARDENING)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_id_param LIMIT 1),
    'employee'::app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. Add additional security for timesheet integrity
CREATE OR REPLACE FUNCTION public.validate_timesheet_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent changing employee_id after creation
  IF TG_OP = 'UPDATE' AND OLD.employee_id != NEW.employee_id THEN
    RAISE EXCEPTION 'Cannot change timesheet owner';
  END IF;
  
  -- Prevent backdating submissions beyond 30 days
  IF NEW.status = 'submitted' AND NEW.week_end_date < CURRENT_DATE - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Cannot submit timesheets older than 30 days';
  END IF;
  
  -- Enhanced logging for timesheet changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_security_event(
      auth.uid(),
      'data_access',
      jsonb_build_object(
        'action', 'timesheet_status_change',
        'timesheet_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'employee_id', NEW.employee_id,
        'week_period', NEW.week_start_date || ' to ' || NEW.week_end_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';