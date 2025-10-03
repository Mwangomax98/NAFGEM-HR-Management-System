import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useEmployeeProfileUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const updateEmployeeProfile = async (employeeId: string, profileData: any) => {
    setIsLoading(true);
    try {
      // Helper function to format dates
      const formatDate = (date: any) => {
        if (!date) return null;
        return typeof date === 'string' 
          ? date 
          : date instanceof Date 
            ? date.toISOString().split('T')[0]
            : null;
      };

      // Transform the component format back to database format
      const dbData = {
        name_full: profileData.personal.nameFull,
        national_id: profileData.personal.nationalId,
        tin_no: profileData.personal.tinNo || null,
        contact_address: profileData.personal.contactAddress,
        
        // Fix: Handle phone array properly
        mobile_phones: Array.isArray(profileData.personal.mobilePhones)
          ? profileData.personal.mobilePhones.filter(Boolean)
          : typeof profileData.personal.mobilePhones === 'string'
            ? profileData.personal.mobilePhones.split(',').map((p: string) => p.trim()).filter(Boolean)
            : [],
        
        designation: profileData.personal.designation,
        place_of_work: profileData.personal.placeOfWork,
        
        // Add: date_of_appointment
        date_of_appointment: formatDate(profileData.personal.dateOfAppointment),
        
        terms_of_service: profileData.personal.termsOfService.toLowerCase(),
        nationality: profileData.personal.nationality,
        date_of_birth: formatDate(profileData.personal.dateOfBirth),
        place_of_birth: profileData.personal.placeOfBirth,
        religion: profileData.personal.religion || null,
        marital_status: profileData.personal.maritalStatus.toLowerCase(),
        spouse_name: profileData.personal.spouseName || null,
        spouse_contacts: profileData.personal.spouseContacts || null,
        
        // Add: passport_photo_url
        passport_photo_url: profileData.personal.passportPhotoUrl || null,
        
        father_name: profileData.family.fatherName,
        father_place_of_birth: profileData.family.fatherPlaceOfBirth,
        father_nationality: profileData.family.fatherNationality,
        mother_name: profileData.family.motherName,
        mother_place_of_birth: profileData.family.motherPlaceOfBirth,
        mother_nationality: profileData.family.motherNationality,
        
        // Fix: children structure
        children: (profileData.family.children || []).map((child: any) => ({
          name: child.name,
          sex: child.sex,
          dateOfBirth: formatDate(child.dateOfBirth),
          birthCertificateUrl: child.birthCertificateUrl || null,
        })),
        
        // Fix: education structure
        education: (profileData.education || []).map((edu: any) => ({
          institution: edu.institution,
          place: edu.place,
          fromDate: formatDate(edu.fromDate),
          toDate: formatDate(edu.toDate),
          certificateUrls: edu.certificateUrls || [],
        })),
        
        // Fix: next_of_kin structure
        next_of_kin: (profileData.nextOfKin || []).map((kin: any) => ({
          name: kin.name,
          age: kin.age,
          relation: kin.relation,
          contact: kin.contact,
          primary: kin.primary || false,
        })),
        
        // Fix: projects structure
        projects: (profileData.employment.projects || []).map((proj: any) => ({
          projectId: proj.projectId,
          projectName: proj.projectName,
          donor: proj.donor,
          code: proj.code,
          isPrimary: proj.isPrimary || false,
        })),
        
        // Add: employee_id
        employee_id: profileData.employment.employeeId,
        
        user_role: profileData.employment.userRole.toLowerCase(),
        status: profileData.employment.status.toLowerCase(),
        
        // Add: declaration fields
        declaration_text: profileData.declaration?.text || 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.',
        declaration_signed_by: profileData.declaration?.signedBy || profileData.personal.nameFull,
        declaration_signed_at: formatDate(profileData.declaration?.signedAt || new Date()),
        
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