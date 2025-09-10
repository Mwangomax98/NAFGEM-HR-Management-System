-- CRITICAL SECURITY FIX: Remove public access to projects table
-- Drop the dangerous public access policy
DROP POLICY IF EXISTS "Everyone can view active projects" ON public.projects;

-- Drop duplicate policies for cleaner setup
DROP POLICY IF EXISTS "HR and Admin can manage projects" ON public.projects;

-- Recreate proper RLS policies with secure access control
-- Only allow authenticated users to view projects they're assigned to or HR/Admin users
CREATE POLICY "Secure project access for authenticated users" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (
  -- Users can only see projects they are assigned to via their profile
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.project = projects.id
  ))
  OR 
  -- HR and Admin can see all projects
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- HR and Admin can manage all projects (insert, update, delete)
CREATE POLICY "HR and Admin can manage all projects" 
ON public.projects 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;