-- PHASE 2: FIX REMAINING SECURITY WARNINGS

-- Fix the remaining functions that need search_path hardening
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type text, p_details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (p_user_id, p_event_type, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_role_assignment(assigner_id uuid, target_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can assign any role
  IF has_role(assigner_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- HR can assign employee and hr roles, but not admin
  IF has_role(assigner_id, 'hr'::app_role) AND target_role != 'admin'::app_role THEN
    RETURN true;
  END IF;
  
  -- No one else can assign roles
  RETURN false;
END;
$$;

-- Fix other security definer functions
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.enforce_rate_limit_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rate limit role assignments (max 10 per hour per user)
  IF NOT check_rate_limit(auth.uid(), 'role_assignment', 10, '1 hour'::interval) THEN
    RAISE EXCEPTION 'Rate limit exceeded for role assignments. Maximum 10 per hour.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;