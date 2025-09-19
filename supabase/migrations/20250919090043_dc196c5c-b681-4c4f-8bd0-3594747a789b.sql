-- Check current RLS policies on employee_profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'employee_profiles';

-- Also check if employee_profiles table exists and its structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'employee_profiles' 
ORDER BY ordinal_position;