-- Security Fixes: Phase 2 - Address Security Linter Issues

-- 1. Fix function search_path issues for all remaining functions
CREATE OR REPLACE FUNCTION public.update_task_completion_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_task_conversation_fkey()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;