import { supabase } from "@/lib/api";

export const debugUserAccess = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (import.meta.env.DEV) {
      console.log('Current user:', user?.id);
    }

    // Check user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user?.id);
    
    if (import.meta.env.DEV) {
      console.log('User role data:', roleData, 'Error:', roleError);
    }

    // Try to fetch employee profile
    const { data: profileData, error: profileError } = await supabase
      .from('employee_profiles')
      .select('*')
      .eq('user_id', user?.id);
    
    if (import.meta.env.DEV) {
      console.log('Employee profile data:', profileData, 'Error:', profileError);
    }

    // Try to fetch all profiles (HR/Admin only)
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('employee_profiles')
      .select('*');
    
    if (import.meta.env.DEV) {
      console.log('All profiles data:', allProfiles?.length || 0, 'Error:', allProfilesError);
    }

    return {
      user: user?.id,
      role: roleData,
      profile: profileData,
      allProfiles: allProfiles?.length || 0,
      errors: {
        role: roleError,
        profile: profileError,
        allProfiles: allProfilesError
      }
    };
  } catch (error) {
    console.error('Debug error:', error);
    return { error };
  }
};