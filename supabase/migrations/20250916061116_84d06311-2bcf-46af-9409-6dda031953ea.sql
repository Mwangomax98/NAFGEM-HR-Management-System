-- Fix RLS policies for employee_profiles to ensure HR/Admin can manage all profiles
-- First drop existing policies that might be incomplete
DROP POLICY IF EXISTS "HR and Admin can manage all employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can view all employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can create employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can update all employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can delete employee profiles" ON public.employee_profiles;

-- Create comprehensive RLS policies for HR/Admin full access
CREATE POLICY "HR and Admin can manage all employee profiles"
ON public.employee_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION public.update_employee_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_employee_profiles_updated_at ON public.employee_profiles;
CREATE TRIGGER update_employee_profiles_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employee_profile_timestamp();

-- Add unique constraints to prevent duplicates (only if they don't exist)
DO $$ 
BEGIN
  -- Check if unique constraint on user_id exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employee_profiles_user_id_unique' 
    AND table_name = 'employee_profiles'
  ) THEN
    ALTER TABLE public.employee_profiles ADD CONSTRAINT employee_profiles_user_id_unique UNIQUE (user_id);
  END IF;
  
  -- Check if unique constraint on employee_id exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employee_profiles_employee_id_unique' 
    AND table_name = 'employee_profiles'
  ) THEN
    ALTER TABLE public.employee_profiles ADD CONSTRAINT employee_profiles_employee_id_unique UNIQUE (employee_id);
  END IF;
END $$;