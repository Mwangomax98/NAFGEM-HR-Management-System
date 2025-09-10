-- CRITICAL SECURITY FIX: Remove dangerous policy that exposes all employee profiles
-- This policy allowed any authenticated user to access all sensitive employee data
DROP POLICY IF EXISTS "System can manage employee profiles" ON public.employee_profiles;

-- Remove redundant policy (covered by the one below)
DROP POLICY IF EXISTS "Employees can view linked profiles" ON public.employee_profiles;

-- Ensure proper RLS policies are in place for employee_profiles
-- 1. Employees can only view their own profile
CREATE POLICY "Employees can view own profile only"
ON public.employee_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Employees can only update their own profile  
CREATE POLICY "Employees can update own profile only"
ON public.employee_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. HR and Admin have full access (already exists but ensuring it's correct)
-- The existing "HR and Admin can manage all employee profiles" policy is secure

-- 4. Only HR/Admin can create new employee profiles
CREATE POLICY "Only HR and Admin can create employee profiles"
ON public.employee_profiles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Only HR/Admin can delete employee profiles
CREATE POLICY "Only HR and Admin can delete employee profiles"
ON public.employee_profiles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));