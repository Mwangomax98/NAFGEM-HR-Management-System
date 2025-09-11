-- Add unique constraint to prevent duplicate employee profiles for the same user
ALTER TABLE public.employee_profiles 
ADD CONSTRAINT unique_user_employee_profile 
UNIQUE (user_id);