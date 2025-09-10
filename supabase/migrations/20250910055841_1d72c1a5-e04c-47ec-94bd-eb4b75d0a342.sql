-- CRITICAL SECURITY FIX: Remove the dangerous policy that exposes all employee profiles  
DROP POLICY IF EXISTS "System can manage employee profiles" ON public.employee_profiles;

-- Remove redundant policy
DROP POLICY IF EXISTS "Employees can view linked profiles" ON public.employee_profiles;

-- Add missing secure policies (only if they don't exist)
DO $$
BEGIN
    -- Only HR/Admin can create new employee profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_profiles' 
        AND policyname = 'Only HR and Admin can create employee profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Only HR and Admin can create employee profiles"
        ON public.employee_profiles
        FOR INSERT
        TO authenticated
        WITH CHECK (has_role(auth.uid(), ''hr''::app_role) OR has_role(auth.uid(), ''admin''::app_role))';
    END IF;

    -- Only HR/Admin can delete employee profiles  
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_profiles' 
        AND policyname = 'Only HR and Admin can delete employee profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Only HR and Admin can delete employee profiles"
        ON public.employee_profiles
        FOR DELETE
        TO authenticated
        USING (has_role(auth.uid(), ''hr''::app_role) OR has_role(auth.uid(), ''admin''::app_role))';
    END IF;

    -- Employees can only update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employee_profiles' 
        AND policyname = 'Employees can update own profile only'
    ) THEN
        EXECUTE 'CREATE POLICY "Employees can update own profile only"
        ON public.employee_profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)';
    END IF;
END $$;