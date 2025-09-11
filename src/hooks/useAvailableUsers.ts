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

      // Get all users from profiles table
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, project, title')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Get users who already have employee profiles
      const { data: existingEmployees, error: employeeError } = await supabase
        .from('employee_profiles')
        .select('user_id');

      if (employeeError) throw employeeError;

      // Filter out users who already have employee profiles
      const existingUserIds = new Set(existingEmployees?.map(emp => emp.user_id));
      const availableProfiles = allProfiles?.filter(profile => 
        profile.id && !existingUserIds.has(profile.id)
      ) || [];

      setUsers(availableProfiles);
    } catch (err) {
      console.error('Error fetching available users:', err);
      setError('Failed to load available users');
      toast({
        title: "Error",
        description: "Failed to load available users.",
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