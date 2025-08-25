-- Create a corrected migration to fix the remaining role issues

-- 1. Update existing roles to use consistent casing (already lowercase in enum)
-- No changes needed as roles are already properly stored

-- 2. Add real-time replication for user_roles table
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- 3. Create a function to safely get user role with fallback
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_id_param LIMIT 1),
    'employee'::app_role
  );
$$;

-- 4. Add an index for better performance on role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- 5. Add a constraint to prevent duplicate roles for the same user
ALTER TABLE public.user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id);