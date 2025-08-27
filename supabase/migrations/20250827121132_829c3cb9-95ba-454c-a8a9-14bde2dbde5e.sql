-- Critical Security Fixes: Phase 1 - Role Protection and Data Integrity
-- (Skipping views, focusing on actual security vulnerabilities)

-- 1. Fix critical role self-assignment vulnerability
-- Drop existing problematic policies that allowed self-modification
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

-- 2. Add role change validation trigger (CRITICAL SECURITY)
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

-- 3. Add data integrity constraints (SECURITY HARDENING)
ALTER TABLE public.kpi_values
ADD CONSTRAINT check_actual_value_positive 
CHECK (actual_value >= 0);

ALTER TABLE public.weekly_targets
ADD CONSTRAINT check_target_value_positive 
CHECK (target_value >= 0);

ALTER TABLE public.timesheet_entries
ADD CONSTRAINT check_hours_worked_valid 
CHECK (hours_worked >= 0 AND hours_worked <= 24);

-- 4. Secure database functions by setting explicit search_path (SECURITY HARDENING)
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

-- 5. Enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (p_user_id, p_event_type, p_details);
END;
$$;

-- 6. Add rate limiting for sensitive operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_operation text, p_max_attempts integer, p_time_window interval)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_events
  WHERE user_id = p_user_id
    AND event_type = p_operation
    AND created_at > (now() - p_time_window);
    
  RETURN attempt_count < p_max_attempts;
END;
$$;

-- 7. Audit trail for sensitive data modifications
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changes to sensitive tables
  IF TG_TABLE_NAME IN ('user_roles', 'profiles', 'kpis') THEN
    PERFORM log_security_event(
      auth.uid(),
      'sensitive_data_modification',
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', COALESCE(NEW.id, OLD.id),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

CREATE TRIGGER audit_kpis_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.kpis
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();