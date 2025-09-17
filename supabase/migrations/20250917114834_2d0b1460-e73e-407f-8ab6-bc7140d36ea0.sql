-- Add missing INSERT policy to profiles table to allow trigger function to create profiles
CREATE POLICY "System can insert profiles during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Ensure user_roles has proper INSERT policy for trigger function
-- Check if the policy already exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_roles' 
        AND policyname = 'System can assign initial roles'
    ) THEN
        EXECUTE 'CREATE POLICY "System can assign initial roles" ON public.user_roles FOR INSERT WITH CHECK (true)';
    END IF;
END $$;