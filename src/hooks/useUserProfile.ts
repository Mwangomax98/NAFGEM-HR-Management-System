import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { STUB_USER_ID } from '@/lib/currentUser';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  project: string | null;
  title: string | null;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserProfile(userId?: string): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const id = userId || STUB_USER_ID;
      const { data, error: fetchError } = await api
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user profile:', fetchError);
        setError(fetchError.message);
        toast({
          title: "Error",
          description: "Failed to load user profile.",
          variant: "destructive",
        });
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return {
    profile,
    loading,
    error,
    refetch,
  };
}
