-- Fix the security warnings identified by the linter

-- Security Fix 9: Fix function search path issues by setting search_path
CREATE OR REPLACE FUNCTION public.validate_task_conversation_fkey()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only validate foreign key for task-related conversations
  IF NEW.conversation_type = 'task_related' THEN
    IF NOT EXISTS (SELECT 1 FROM public.task_evaluations WHERE id = NEW.task_evaluation_id) THEN
      RAISE EXCEPTION 'task_evaluation_id must exist in task_evaluations for task_related conversations';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  IF NEW.email = 'itofficernafgem@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'employee');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, new_role, changed_by, action)
    VALUES (NEW.user_id, NEW.role, COALESCE(NEW.assigned_by, auth.uid()), 'assigned');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, action)
    VALUES (NEW.user_id, OLD.role, NEW.role, auth.uid(), 'modified');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, changed_by, action)
    VALUES (OLD.user_id, OLD.role, auth.uid(), 'revoked');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (p_user_id, p_event_type, p_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_timesheet_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent changing employee_id after creation
  IF TG_OP = 'UPDATE' AND OLD.employee_id != NEW.employee_id THEN
    RAISE EXCEPTION 'Cannot change timesheet owner';
  END IF;
  
  -- Prevent backdating submissions beyond 30 days
  IF NEW.status = 'submitted' AND NEW.week_end_date < CURRENT_DATE - INTERVAL '30 days' THEN
    RAISE EXCEPTION 'Cannot submit timesheets older than 30 days';
  END IF;
  
  -- Log timesheet status changes
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'data_access',
      jsonb_build_object(
        'action', 'timesheet_status_change',
        'timesheet_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'employee_id', NEW.employee_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;