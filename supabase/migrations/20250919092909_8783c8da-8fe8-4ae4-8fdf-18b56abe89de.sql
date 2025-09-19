-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Employees can view their own profile" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can view all employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can insert employee profiles" ON public.employee_profiles;
DROP POLICY IF EXISTS "HR and Admin can update employee profiles" ON public.employee_profiles;

-- Enable Row Level Security on employee_profiles table (if not already enabled)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'employee_profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create comprehensive policies for employee_profiles
CREATE POLICY "HR and Admin can view all employee profiles" 
ON public.employee_profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can insert employee profiles" 
ON public.employee_profiles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HR and Admin can update employee profiles" 
ON public.employee_profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employees can view their own profile" 
ON public.employee_profiles 
FOR SELECT 
USING (auth.uid() = user_id);