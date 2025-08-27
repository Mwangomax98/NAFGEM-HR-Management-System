-- Fix Role Assignment Issues

-- 1. Add unique constraint on user_id for proper upsert functionality
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- 2. Update RLS policies to allow HR users to assign roles (but not admin roles)
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- New policies: Admins can do everything, HR can assign non-admin roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR can assign non-admin roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  has_role(auth.uid(), 'hr'::app_role) AND 
  NEW.role != 'admin'::app_role
);

CREATE POLICY "HR can update non-admin roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  OLD.role != 'admin'::app_role AND 
  NEW.role != 'admin'::app_role
);

-- 3. Create enhanced role assignment validation function
CREATE OR REPLACE FUNCTION public.validate_role_assignment(
  assigner_id uuid,
  target_role app_role
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- 4. Add trigger to validate role assignments
CREATE OR REPLACE FUNCTION public.check_role_assignment_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT validate_role_assignment(auth.uid(), NEW.role) THEN
    RAISE EXCEPTION 'Insufficient permissions to assign role: %', NEW.role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role assignment validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_assignment_permission();

-- 5. Ensure proper triggers are attached
DROP TRIGGER IF EXISTS log_role_changes_trigger ON public.user_roles;
CREATE TRIGGER log_role_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();

DROP TRIGGER IF EXISTS validate_role_changes_trigger ON public.user_roles;
CREATE TRIGGER validate_role_changes_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_changes();

DROP TRIGGER IF EXISTS enforce_rate_limit_roles_trigger ON public.user_roles;
CREATE TRIGGER enforce_rate_limit_roles_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rate_limit_roles();