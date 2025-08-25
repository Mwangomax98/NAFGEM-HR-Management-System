import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/lib/roles';

interface UseUserRoleReturn {
  userRole: AppRole | null;
  loading: boolean;
  error: string | null;
  refetchRole: () => Promise<void>;
}

export const useUserRole = (userId?: string): UseUserRoleReturn => {
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get current user if no userId provided
      const { data: { user } } = await supabase.auth.getUser();
      const finalUserId = targetUserId || user?.id;
      
      if (!finalUserId) {
        setUserRole(null);
        return;
      }

      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', finalUserId)
        .single();

      if (roleError) {
        if (roleError.code === 'PGRST116') {
          // No role found, default to employee
          setUserRole('employee');
        } else {
          throw roleError;
        }
      } else {
        setUserRole(data.role as AppRole);
      }
    } catch (err: any) {
      console.error('Error fetching user role:', err);
      setError(err.message || 'Failed to fetch user role');
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchRole = async () => {
    await fetchUserRole(userId);
  };

  useEffect(() => {
    fetchUserRole(userId);
  }, [userId]);

  // Listen for role changes in real-time
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return userId || user?.id;
    };
    
    getCurrentUser().then(targetUserId => {
    
    if (!targetUserId) return;

    const channel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setUserRole('employee'); // Default fallback
          } else {
            setUserRole((payload.new as any)?.role || 'employee');
          }
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [userId]);

  return {
    userRole,
    loading,
    error,
    refetchRole
  };
};