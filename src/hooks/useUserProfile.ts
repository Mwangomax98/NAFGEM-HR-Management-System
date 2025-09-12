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

      let query = supabase.from('profiles').select('*');
      
      if (userId) {
        query = query.eq('id', userId);
      } else {
        // Fetch current user's profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }
        query = query.eq('id', user.id);
      }

      const { data, error: fetchError } = await query.maybeSingle();

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

    // Set up real-time subscription for profile updates
    const currentUserId = userId;
    const subscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: currentUserId ? `id=eq.${currentUserId}` : undefined
        },
        (payload) => {
          console.log('Real-time profile update:', payload);
          setProfile(payload.new as UserProfile);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    profile,
    loading,
    error,
    refetch,
  };
}