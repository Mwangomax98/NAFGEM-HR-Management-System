-- Enable Row Level Security on employee_profiles table
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for HR and Admin to view all employee profiles
CREATE POLICY "HR and Admin can view all employee profiles" 
ON public.employee_profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for HR and Admin to insert employee profiles
CREATE POLICY "HR and Admin can insert employee profiles" 
ON public.employee_profiles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for HR and Admin to update employee profiles
CREATE POLICY "HR and Admin can update employee profiles" 
ON public.employee_profiles 
FOR UPDATE 
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create policy for employees to view their own profile
CREATE POLICY "Employees can view their own profile" 
ON public.employee_profiles 
FOR SELECT 
USING (auth.uid() = user_id);