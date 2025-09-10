-- Fix employee_profiles table schema issues

-- Add missing status column with proper default if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_profiles' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.employee_profiles 
        ADD COLUMN status text NOT NULL DEFAULT 'active';
    END IF;
END $$;

-- Ensure mobile_phones column exists and has proper type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_profiles' 
        AND column_name = 'mobile_phones'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.employee_profiles 
        ADD COLUMN mobile_phones text[] NOT NULL DEFAULT '{}';
    END IF;
END $$;

-- Test the has_role function by creating a simple test function for debugging
CREATE OR REPLACE FUNCTION public.debug_user_role()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'auth_uid', auth.uid(),
        'user_exists', EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid()),
        'role_record', (SELECT jsonb_build_object('role', role, 'user_id', user_id) FROM user_roles WHERE user_id = auth.uid()),
        'has_hr_role', has_role(auth.uid(), 'hr'::app_role),
        'has_admin_role', has_role(auth.uid(), 'admin'::app_role)
    );
$$;