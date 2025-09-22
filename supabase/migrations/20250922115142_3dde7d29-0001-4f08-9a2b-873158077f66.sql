-- Create missing employee profiles for existing users
DO $$
DECLARE
    user_record RECORD;
    profile_data jsonb;
BEGIN
    -- Loop through users who don't have employee profiles
    FOR user_record IN 
        SELECT p.id, p.email, p.full_name, p.project, p.title
        FROM profiles p
        LEFT JOIN employee_profiles ep ON p.id = ep.user_id
        WHERE ep.user_id IS NULL
    LOOP
        -- Create basic profile data
        profile_data := jsonb_build_object(
            'name_full', COALESCE(user_record.full_name, 'Unknown'),
            'designation', COALESCE(user_record.title, 'Unknown'),
            'place_of_work', COALESCE(user_record.project, 'Unknown')
        );
        
        -- Use the existing function to create the profile
        PERFORM admin_create_employee_profile(user_record.id, profile_data);
        
        RAISE NOTICE 'Created profile for user: %', user_record.email;
    END LOOP;
END $$;