-- Fix Role Assignment Issues (Fixed Version)

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
  role != 'admin'::app_role
);

CREATE POLICY "HR can update non-admin roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated 
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  role != 'admin'::app_role
)
WITH CHECK (
  has_role(auth.uid(), 'hr'::app_role) AND 
  role != 'admin'::app_role
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