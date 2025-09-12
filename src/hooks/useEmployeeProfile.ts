import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeProfile {
  id: string;
  user_id?: string;
  name_full: string;
  national_id: string;
  tin_no?: string;
  contact_address: string;
  mobile_phones: string[];
  designation: string;
  place_of_work: string;
  date_of_appointment: string;
  terms_of_service: string;
  nationality: string;
  date_of_birth: string;
  place_of_birth: string;
  religion?: string;
  marital_status: string;
  spouse_name?: string;
  spouse_contacts?: string;
  passport_photo_url?: string;
  father_name: string;
  father_place_of_birth: string;
  father_nationality: string;
  mother_name: string;
  mother_place_of_birth: string;
  mother_nationality: string;
  children: any[];
  education: any[];
  next_of_kin: any[];
  declaration_text: string;
  declaration_signed_by: string;
  declaration_signed_at: string;
  employee_id: string;
  user_role: string;
  status: string;
  projects: any[];
  created_at: string;
  updated_at: string;
}

interface UseEmployeeProfileReturn {
  profile: EmployeeProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEmployeeProfile(userId?: string): UseEmployeeProfileReturn {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('employee_profiles').select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // Fetch current user's profile
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query.maybeSingle();

      if (fetchError) {
        console.error('Error fetching employee profile:', fetchError);
        setError(fetchError.message);
        toast({
          title: "Error",
          description: "Failed to load employee profile.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Parse JSON fields
        const profileData = {
          ...data,
          children: Array.isArray(data.children) ? data.children : JSON.parse(String(data.children || '[]')),
          education: Array.isArray(data.education) ? data.education : JSON.parse(String(data.education || '[]')),
          next_of_kin: Array.isArray(data.next_of_kin) ? data.next_of_kin : JSON.parse(String(data.next_of_kin || '[]')),
          projects: Array.isArray(data.projects) ? data.projects : JSON.parse(String(data.projects || '[]')),
        };
        setProfile(profileData);
      } else {
        setProfile(null);
      }
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

    // Set up real-time subscription for individual profile
    const currentUserId = userId;
    const subscription = supabase
      .channel('employee_profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employee_profiles',
          filter: currentUserId ? `user_id=eq.${currentUserId}` : undefined
        },
        (payload) => {
          console.log('Real-time profile update:', payload);
          const updatedProfile = payload.new as any;
          
          if (updatedProfile) {
            const profileData = {
              ...updatedProfile,
              children: Array.isArray(updatedProfile.children) ? updatedProfile.children : JSON.parse(String(updatedProfile.children || '[]')),
              education: Array.isArray(updatedProfile.education) ? updatedProfile.education : JSON.parse(String(updatedProfile.education || '[]')),
              next_of_kin: Array.isArray(updatedProfile.next_of_kin) ? updatedProfile.next_of_kin : JSON.parse(String(updatedProfile.next_of_kin || '[]')),
              projects: Array.isArray(updatedProfile.projects) ? updatedProfile.projects : JSON.parse(String(updatedProfile.projects || '[]')),
            };
            setProfile(profileData);
            
            toast({
              title: "Profile Updated",
              description: "Your employee profile has been updated.",
            });
          }
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

export function useAllEmployeeProfiles() {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('employee_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching employee profiles:', fetchError);
        setError(fetchError.message);
        toast({
          title: "Error",
          description: "Failed to load employee profiles.",
          variant: "destructive",
        });
        return;
      }

      const parsedProfiles = data.map(profile => ({
        ...profile,
        children: Array.isArray(profile.children) ? profile.children : JSON.parse(String(profile.children || '[]')),
        education: Array.isArray(profile.education) ? profile.education : JSON.parse(String(profile.education || '[]')),
        next_of_kin: Array.isArray(profile.next_of_kin) ? profile.next_of_kin : JSON.parse(String(profile.next_of_kin || '[]')),
        projects: Array.isArray(profile.projects) ? profile.projects : JSON.parse(String(profile.projects || '[]')),
      }));

      setProfiles(parsedProfiles);
    } catch (err) {
      console.error('Unexpected error fetching profiles:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();

    // Set up real-time subscription for employee profiles
    const subscription = supabase
      .channel('employee_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employee_profiles'
        },
        (payload) => {
          console.log('Real-time update for employee profiles:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newProfile = payload.new as any;
            const parsedProfile = {
              ...newProfile,
              children: Array.isArray(newProfile.children) ? newProfile.children : JSON.parse(String(newProfile.children || '[]')),
              education: Array.isArray(newProfile.education) ? newProfile.education : JSON.parse(String(newProfile.education || '[]')),
              next_of_kin: Array.isArray(newProfile.next_of_kin) ? newProfile.next_of_kin : JSON.parse(String(newProfile.next_of_kin || '[]')),
              projects: Array.isArray(newProfile.projects) ? newProfile.projects : JSON.parse(String(newProfile.projects || '[]')),
            };
            
            setProfiles(current => [parsedProfile, ...current]);
            toast({
              title: "New Employee Added",
              description: `${newProfile.name_full} has been added to the system.`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProfile = payload.new as any;
            const parsedProfile = {
              ...updatedProfile,
              children: Array.isArray(updatedProfile.children) ? updatedProfile.children : JSON.parse(String(updatedProfile.children || '[]')),
              education: Array.isArray(updatedProfile.education) ? updatedProfile.education : JSON.parse(String(updatedProfile.education || '[]')),
              next_of_kin: Array.isArray(updatedProfile.next_of_kin) ? updatedProfile.next_of_kin : JSON.parse(String(updatedProfile.next_of_kin || '[]')),
              projects: Array.isArray(updatedProfile.projects) ? updatedProfile.projects : JSON.parse(String(updatedProfile.projects || '[]')),
            };
            
            setProfiles(current => current.map(profile => 
              profile.id === updatedProfile.id ? parsedProfile : profile
            ));
          } else if (payload.eventType === 'DELETE') {
            const deletedProfile = payload.old as any;
            setProfiles(current => current.filter(profile => profile.id !== deletedProfile.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
  };
}