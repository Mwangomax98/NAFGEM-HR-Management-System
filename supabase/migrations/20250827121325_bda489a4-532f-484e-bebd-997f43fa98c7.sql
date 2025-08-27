-- Security Fixes: Phase 2 - Address Linter Issues and Remaining Security Gaps

-- 1. Fix Security Definer Views - These are likely the views created automatically
-- We need to identify and fix them. Let's check the problematic functions first.

-- 2. Fix remaining functions that don't have explicit search_path
CREATE OR REPLACE FUNCTION public.update_task_completion_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If task is being marked as completed and actual_completion_date is not set
  IF NEW.completion_status = 'completed' AND OLD.completion_status != 'completed' AND NEW.actual_completion_date IS NULL THEN
    NEW.actual_completion_date = CURRENT_DATE;
  END IF;
  
  -- If task is being unmarked as completed, clear the actual_completion_date
  IF NEW.completion_status != 'completed' AND OLD.completion_status = 'completed' THEN
    NEW.actual_completion_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.validate_task_conversation_fkey()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate foreign key for task-related conversations
  IF NEW.conversation_type = 'task_related' THEN
    IF NOT EXISTS (SELECT 1 FROM public.task_evaluations WHERE id = NEW.task_evaluation_id) THEN
      RAISE EXCEPTION 'task_evaluation_id must exist in task_evaluations for task_related conversations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, new_role, changed_by, action)
    VALUES (
      NEW.user_id, 
      NEW.role, 
      COALESCE(NEW.assigned_by, auth.uid(), NEW.user_id), 
      'assigned'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, action)
    VALUES (
      NEW.user_id, 
      OLD.role, 
      NEW.role, 
      COALESCE(auth.uid(), NEW.user_id), 
      'modified'
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, changed_by, action)
    VALUES (
      OLD.user_id, 
      OLD.role, 
      COALESCE(auth.uid(), OLD.user_id), 
      'revoked'
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, project, title)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'project',
    NEW.raw_user_meta_data ->> 'title'
  );
  
  -- Assign admin role to specific email, employee role to others
  -- Set assigned_by to the new user's ID for initial role assignment
  IF NEW.email = 'itofficernafgem@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'admin', NEW.id);
  ELSE
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'employee', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- 3. Add additional security constraints for business logic
-- Prevent negative values in sensitive calculations
ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS check_total_hours_valid;
ALTER TABLE public.timesheets
ADD CONSTRAINT check_total_hours_valid 
CHECK (total_hours >= 0 AND total_hours <= 168); -- Max 24*7 hours per week

ALTER TABLE public.timesheets DROP CONSTRAINT IF EXISTS check_overtime_hours_valid;
ALTER TABLE public.timesheets
ADD CONSTRAINT check_overtime_hours_valid 
CHECK (overtime_hours >= 0 AND overtime_hours <= total_hours);

-- 4. Add enhanced input validation for critical fields
-- Ensure email addresses are properly formatted
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_email_format;
ALTER TABLE public.profiles
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 5. Add rate limiting enforcement for critical operations
CREATE OR REPLACE FUNCTION public.enforce_rate_limit_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Rate limit role assignments (max 10 per hour per user)
  IF NOT check_rate_limit(auth.uid(), 'role_assignment', 10, '1 hour'::interval) THEN
    RAISE EXCEPTION 'Rate limit exceeded for role assignments. Maximum 10 per hour.';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Apply rate limiting to role changes
DROP TRIGGER IF EXISTS enforce_rate_limit_roles_trigger ON public.user_roles;
CREATE TRIGGER enforce_rate_limit_roles_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit_roles();

-- 6. Create function to check for potential security threats
CREATE OR REPLACE FUNCTION public.detect_security_anomalies()
RETURNS void AS $$
DECLARE
  suspicious_count integer;
BEGIN
  -- Detect multiple failed role assignments from same user
  SELECT COUNT(*) INTO suspicious_count
  FROM public.security_events
  WHERE event_type = 'role_assignment_failed'
    AND user_id = auth.uid()
    AND created_at > (now() - '1 hour'::interval);
    
  IF suspicious_count > 5 THEN
    PERFORM log_security_event(
      auth.uid(),
      'security_anomaly_detected',
      jsonb_build_object(
        'anomaly_type', 'repeated_role_assignment_failures',
        'count', suspicious_count,
        'time_window', '1 hour'
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';