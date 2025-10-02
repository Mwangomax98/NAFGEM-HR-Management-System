import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  project: string | null;
  title: string | null;
}

export function useAvailableUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useAvailableUsers] Starting fetch...');

      // Get all users from profiles table
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, project, title')
        .order('full_name');

      console.log('📊 [useAvailableUsers] Profiles fetched:', {
        count: allProfiles?.length || 0,
        error: profilesError,
        profiles: allProfiles
      });

      if (profilesError) {
        console.error('❌ [useAvailableUsers] Profiles error:', profilesError);
        throw profilesError;
      }

      // Get users who already have employee profiles
      const { data: existingEmployees, error: employeeError } = await supabase
        .from('employee_profiles')
        .select('user_id');

      console.log('👥 [useAvailableUsers] Existing employees:', {
        count: existingEmployees?.length || 0,
        error: employeeError,
        employees: existingEmployees
      });

      if (employeeError) {
        console.error('❌ [useAvailableUsers] Employee profiles error:', employeeError);
        throw employeeError;
      }

      // Filter out users who already have employee profiles
      const existingUserIds = new Set(existingEmployees?.map(emp => emp.user_id));
      const availableProfiles = allProfiles?.filter(profile => 
        profile.id && !existingUserIds.has(profile.id)
      ) || [];

      console.log('✅ [useAvailableUsers] Available users:', {
        total_profiles: allProfiles?.length || 0,
        existing_employees: existingEmployees?.length || 0,
        available: availableProfiles.length,
        users: availableProfiles
      });

      setUsers(availableProfiles);
    } catch (err: any) {
      console.error('❌ [useAvailableUsers] Error:', err);
      const errorMessage = err.message || 'Failed to load available users';
      setError(errorMessage);
      toast({
        title: "Error Loading Users",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchAvailableUsers,
  };
}