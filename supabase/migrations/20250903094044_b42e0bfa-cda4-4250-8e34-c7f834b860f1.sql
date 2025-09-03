-- PHASE 1: IMMEDIATE CRITICAL SECURITY FIXES (Final)

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

-- 3. HARDEN DATABASE FUNCTIONS - Add proper search_path to prevent SQL injection
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

-- 4. ENHANCE SECURITY EVENT LOGGING WITH RATE LIMITING
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

-- 5. SECURE ROLE ASSIGNMENT FUNCTION - Add additional security checks
CREATE OR REPLACE FUNCTION public.admin_assign_role(target_user_id uuid, new_role app_role, assigned_by_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role app_role;
  result jsonb;
BEGIN
  -- Rate limit role assignments
  IF NOT check_rate_limit(assigned_by_user_id, 'role_assignment', 10, '1 hour'::interval) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded for role assignments');
  END IF;
  
  -- Get the current user's role directly without RLS
  SELECT role INTO current_user_role 
  FROM user_roles 
  WHERE user_id = assigned_by_user_id;
  
  -- Check if the assigner is an admin
  IF current_user_role != 'admin' THEN
    PERFORM log_security_event(assigned_by_user_id, 'unauthorized_role_assignment_attempt', 
      jsonb_build_object('target_user', target_user_id, 'attempted_role', new_role));
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can assign roles');
  END IF;
  
  -- Upsert the role (insert or update)
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, assigned_by_user_id)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = now();
  
  -- Log the role assignment
  PERFORM log_security_event(
    assigned_by_user_id,
    'role_assignment',
    jsonb_build_object(
      'target_user', target_user_id,
      'role_assigned', new_role,
      'assigned_by', assigned_by_user_id
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Role assigned successfully');
END;
$$;