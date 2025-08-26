-- Fix the handle_new_user function to set assigned_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update log_role_changes function to handle null cases
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;