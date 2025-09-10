-- CRITICAL SECURITY FIX: Remove all existing policies and create secure ones
-- Drop all existing policies on projects table
DROP POLICY IF EXISTS "Everyone can view active projects" ON public.projects;
DROP POLICY IF EXISTS "HR and Admin can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "HR and Admin can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Users can view projects they are assigned to" ON public.projects;

-- Create new secure policies
-- Only authenticated users can view projects they're assigned to or HR/Admin can see all
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

-- Only HR and Admin can create, update, delete projects
CREATE POLICY "HR and Admin can manage projects" 
ON public.projects 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;