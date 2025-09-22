import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmployeeProfileUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateEmployeeProfile = async (employeeId: string, profileData: any) => {
    setIsLoading(true);
    try {
      // Transform the component format back to database format
      const dbData = {
        name_full: profileData.personal.nameFull,
        national_id: profileData.personal.nationalId,
        tin_no: profileData.personal.tinNo || null,
        contact_address: profileData.personal.contactAddress,
        mobile_phones: profileData.personal.mobilePhones,
        designation: profileData.personal.designation,
        place_of_work: profileData.personal.placeOfWork,
        terms_of_service: profileData.personal.termsOfService,
        nationality: profileData.personal.nationality,
        date_of_birth: typeof profileData.personal.dateOfBirth === 'string' 
          ? profileData.personal.dateOfBirth 
          : profileData.personal.dateOfBirth.toISOString().split('T')[0],
        place_of_birth: profileData.personal.placeOfBirth,
        religion: profileData.personal.religion || null,
        marital_status: profileData.personal.maritalStatus,
        spouse_name: profileData.personal.spouseName || null,
        spouse_contacts: profileData.personal.spouseContacts || null,
        father_name: profileData.family.fatherName,
        father_place_of_birth: profileData.family.fatherPlaceOfBirth,
        father_nationality: profileData.family.fatherNationality,
        mother_name: profileData.family.motherName,
        mother_place_of_birth: profileData.family.motherPlaceOfBirth,
        mother_nationality: profileData.family.motherNationality,
        children: profileData.family.children || [],
        education: profileData.education || [],
        next_of_kin: profileData.nextOfKin || [],
        projects: profileData.employment.projects || [],
        user_role: profileData.employment.userRole,
        status: profileData.employment.status,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('employee_profiles')
        .update(dbData)
        .eq('id', employeeId)
        .select()
        .single();

      if (error) {
        console.error('Error updating employee profile:', error);
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Employee profile has been successfully updated.",
      });

      return data;
    } catch (error: any) {
      console.error('Error updating employee profile:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee profile. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateEmployeeProfile,
    isLoading
  };
};