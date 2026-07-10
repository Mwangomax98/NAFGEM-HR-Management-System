import { useState, useEffect } from 'react';
import { supabase } from "@/lib/api";
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
      
      console.log('🔍 [useAvailableUsers] Starting fetch via RPC...');

      // Use secure RPC function that checks HR/Admin role and returns available users
      const { data, error } = await supabase
        .rpc('admin_get_available_users');

      console.log('📊 [useAvailableUsers] RPC result:', {
        count: data?.length || 0,
        error: error,
        users: data
      });

      if (error) {
        console.error('❌ [useAvailableUsers] RPC error:', error);
        
        // Check if it's an access denied error
        if (error.message?.includes('Access denied') || error.message?.includes('permission')) {
          const accessError = 'You need HR or Admin role to view available users';
          setError(accessError);
          toast({
            title: "Access Denied",
            description: accessError,
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      console.log('✅ [useAvailableUsers] Available users:', {
        available: data?.length || 0,
        users: data
      });

      setUsers(data || []);
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