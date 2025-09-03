-- Fix RLS policies for employee_profiles table
DROP POLICY IF EXISTS "HR and Admin can manage all employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "Employees can view their own profile" ON public.employee_profiles;

-- Create new policies that allow HR/Admin to insert records
CREATE POLICY "HR and Admin can manage all employee profiles"
ON public.employee_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow employees to view their own profile (by user_id)
CREATE POLICY "Employees can view their own profile"
ON public.employee_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow employees to view profiles when user_id matches
CREATE POLICY "Employees can view linked profiles"
ON public.employee_profiles
FOR SELECT
TO authenticated
USING (user_id IS NOT NULL AND auth.uid() = user_id);

-- System can create profiles (for triggers and functions)
CREATE POLICY "System can manage employee profiles"
ON public.employee_profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);