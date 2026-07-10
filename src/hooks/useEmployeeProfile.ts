import { useState, useEffect } from 'react';
import { supabase } from "@/lib/api";
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

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(fetchProfile, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
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
    const interval = setInterval(fetchProfiles, 30000);
    return () => clearInterval(interval);
  }, []);

  const applyLocalUpdate = (updatedRow: any) => {
    const parsedProfile = {
      ...updatedRow,
      children: Array.isArray(updatedRow.children) ? updatedRow.children : JSON.parse(String(updatedRow.children || '[]')),
      education: Array.isArray(updatedRow.education) ? updatedRow.education : JSON.parse(String(updatedRow.education || '[]')),
      next_of_kin: Array.isArray(updatedRow.next_of_kin) ? updatedRow.next_of_kin : JSON.parse(String(updatedRow.next_of_kin || '[]')),
      projects: Array.isArray(updatedRow.projects) ? updatedRow.projects : JSON.parse(String(updatedRow.projects || '[]')),
    };
    
    setProfiles(current => current.map(profile => 
      profile.id === updatedRow.id ? parsedProfile : profile
    ));
  };

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    applyLocalUpdate,
  };
}