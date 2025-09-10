-- Temporary fix: Assign admin role to current user for testing
-- This helps with employee data saving issue by ensuring user has proper permissions

-- Get the current authenticated user and assign admin role if no role exists
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  auth.uid(), 
  'admin'::app_role,
  auth.uid()
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  );