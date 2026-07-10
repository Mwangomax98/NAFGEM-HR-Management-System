import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { STUB_USER_ID } from '@/lib/currentUser';
import { AppRole, normalizeRole } from '@/lib/roles';

interface UseUserRoleReturn {
  userRole: AppRole | null;
  loading: boolean;
  error: string | null;
  refetchRole: () => Promise<void>;
}

export const useUserRole = (userId?: string): UseUserRoleReturn => {
  const [userRole, setUserRole] = useState<AppRole | null>('employee');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRole = async (targetUserId?: string) => {
    try {
      setLoading(true);
      setError(null);

      let finalUserId = targetUserId;
      if (!finalUserId) {
        const { data: { user } } = await api.auth.getUser();
        finalUserId = user?.id || STUB_USER_ID;
      }

      const { data, error: roleError } = await api
        .from('user_roles')
        .select('role')
        .eq('user_id', finalUserId)
        .maybeSingle();

      if (roleError) throw roleError;

      setUserRole(normalizeRole(data?.role));
    } catch (err: any) {
      console.error('Error fetching user role:', err);
      setError(err.message || 'Failed to fetch user role');
      setUserRole('employee');
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

  return { userRole, loading, error, refetchRole };
};
