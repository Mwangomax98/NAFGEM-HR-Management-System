-- PHASE 1: IMMEDIATE CRITICAL SECURITY FIXES (Corrected)

-- 1. SECURE PROJECTS TABLE - Enable RLS and create policies
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
    AND project = projects.id
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

-- 5. HARDEN DATABASE FUNCTIONS - Add proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1),
    'employee'::app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_id_param LIMIT 1),
    'employee'::app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role = _role FROM user_roles WHERE user_id = _user_id LIMIT 1),
    false
  );
$$;

-- 6. ENHANCE SECURITY EVENT LOGGING WITH RATE LIMITING
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_operation text, p_max_attempts integer, p_time_window interval)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_events
  WHERE user_id = p_user_id
    AND event_type = p_operation
    AND created_at > (now() - p_time_window);
    
  RETURN attempt_count < p_max_attempts;
END;
$$;