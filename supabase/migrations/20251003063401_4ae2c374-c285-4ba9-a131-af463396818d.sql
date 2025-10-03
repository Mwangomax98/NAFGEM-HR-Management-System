-- Create a secure RPC function to get available users (profiles without employee profiles)
-- Only accessible to HR and Admin roles
CREATE OR REPLACE FUNCTION public.admin_get_available_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  project text,
  title text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user has HR or Admin role
  IF NOT (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: Only HR or Admin can view available users';
  END IF;

  -- Return profiles that don't have employee profiles yet
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.project,
    p.title
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 
    FROM public.employee_profiles ep 
    WHERE ep.user_id = p.id
  )
  ORDER BY p.full_name;
END;
$$;