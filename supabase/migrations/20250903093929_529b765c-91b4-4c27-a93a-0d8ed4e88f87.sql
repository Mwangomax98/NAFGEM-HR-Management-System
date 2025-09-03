-- PHASE 1: IMMEDIATE CRITICAL SECURITY FIXES (Fixed)

-- 1. CREATE PROJECTS TABLE WITH PROPER RLS (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  project_code text UNIQUE,
  budget numeric,
  start_date date,
  end_date date
);

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for projects table
CREATE POLICY "Users can view projects they are assigned to"
ON public.projects
FOR SELECT 
TO authenticated
USING (
  -- Check if user is assigned to project via profiles table
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND project = projects.project_code
  ) OR
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

CREATE POLICY "HR and Admin can manage all projects"
ON public.projects
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX USER_ROLES TABLE SECURITY - Remove overly permissive policies
DROP POLICY IF EXISTS "System can manage roles" ON public.user_roles;

-- Create restrictive policies for user_roles
CREATE POLICY "Users can view only their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can assign roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can modify roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. SECURE KPI_GAPS TABLE (currently has no RLS)
ALTER TABLE public.kpi_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project KPI gaps"
ON public.kpi_gaps
FOR SELECT
TO authenticated
USING (
  project_id = (SELECT project FROM profiles WHERE id = auth.uid()) OR
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "HR and Admin can manage KPI gaps"
ON public.kpi_gaps
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 4. SECURE WEEKLY_TARGET_PROGRESS TABLE (currently has no RLS)
ALTER TABLE public.weekly_target_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their assigned target progress"
ON public.weekly_target_progress
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() OR
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "HR and Admin can manage target progress"
ON public.weekly_target_progress
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));