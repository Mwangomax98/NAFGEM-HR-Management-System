import { useState, useEffect } from "react";
import EmployeeProfile from "@/components/employee/EmployeeProfile";
import { exportProfileToPDF } from "@/utils/pdfExport";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeProfile } from "@/hooks/useEmployeeProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { debugUserAccess } from "@/utils/debug";

export default function Profile() {
  const { profile, loading, error } = useEmployeeProfile();
  const { toast } = useToast();

  // Debug user access on component mount
  useEffect(() => {
    debugUserAccess().then(result => {
      console.log('Profile page debug result:', result);
    });
  }, []);

  const handleEdit = () => {
    toast({
      title: "Edit Restricted",
      description: "Employee profiles can only be edited by HR personnel.",
      variant: "destructive",
    });
  };

  const handleExportPDF = () => {
    if (!profile) return;
    
    // Transform profile data to match expected format for PDF export
    const employeeData = {
      personal: {
        nameFull: profile.name_full,
        nationalId: profile.national_id,
        tinNo: profile.tin_no || "Not set",
        contactAddress: profile.contact_address,
        mobilePhones: profile.mobile_phones,
        designation: profile.designation,
        placeOfWork: profile.place_of_work,
        dateOfAppointment: new Date(profile.date_of_appointment),
        termsOfService: profile.terms_of_service,
        nationality: profile.nationality,
        dateOfBirth: new Date(profile.date_of_birth),
        placeOfBirth: profile.place_of_birth,
        religion: profile.religion || "Not set",
        maritalStatus: profile.marital_status,
        spouseName: profile.spouse_name || "Not set",
        spouseContacts: profile.spouse_contacts || "Not set",
        passportPhotoUrl: profile.passport_photo_url || "/placeholder.svg",
      },
      family: {
        fatherName: profile.father_name,
        fatherPlaceOfBirth: profile.father_place_of_birth,
        fatherNationality: profile.father_nationality,
        motherName: profile.mother_name,
        motherPlaceOfBirth: profile.mother_place_of_birth,
        motherNationality: profile.mother_nationality,
        children: profile.children || [],
      },
      education: profile.education || [],
      nextOfKin: profile.next_of_kin || [],
      declaration: {
        text: profile.declaration_text,
        signedBy: profile.declaration_signed_by,
        signedAt: new Date(profile.declaration_signed_at),
      },
      employment: {
        employeeId: profile.employee_id,
        userRole: profile.user_role,
        status: profile.status,
        projects: profile.projects || [],
      },
    };

    exportProfileToPDF(employeeData);
    toast({
      title: "PDF Export",
      description: "Profile PDF is being generated and will open in a new window.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading profile: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No employee profile found. Please contact HR to have your profile created.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Transform profile data to match expected format for EmployeeProfile component
  const employeeData = {
    personal: {
      nameFull: profile.name_full,
      nationalId: profile.national_id,
      tinNo: profile.tin_no || "Not set",
      contactAddress: profile.contact_address,
      mobilePhones: profile.mobile_phones,
      designation: profile.designation,
      placeOfWork: profile.place_of_work,
      dateOfAppointment: new Date(profile.date_of_appointment),
      termsOfService: profile.terms_of_service,
      nationality: profile.nationality,
      dateOfBirth: new Date(profile.date_of_birth),
      placeOfBirth: profile.place_of_birth,
      religion: profile.religion || "Not set",
      maritalStatus: profile.marital_status,
      spouseName: profile.spouse_name || "Not set",
      spouseContacts: profile.spouse_contacts || "Not set",
      passportPhotoUrl: profile.passport_photo_url || "/placeholder.svg",
    },
    family: {
      fatherName: profile.father_name,
      fatherPlaceOfBirth: profile.father_place_of_birth,
      fatherNationality: profile.father_nationality,
      motherName: profile.mother_name,
      motherPlaceOfBirth: profile.mother_place_of_birth,
      motherNationality: profile.mother_nationality,
      children: profile.children || [],
    },
    education: profile.education || [],
    nextOfKin: profile.next_of_kin || [],
    declaration: {
      text: profile.declaration_text,
      signedBy: profile.declaration_signed_by,
      signedAt: new Date(profile.declaration_signed_at),
    },
    employment: {
      employeeId: profile.employee_id,
      userRole: profile.user_role,
      status: profile.status,
      projects: profile.projects || [],
    },
  };

  return (
    <EmployeeProfile
      employee={employeeData}
      canEdit={false}
      onEdit={handleEdit}
      onExportPDF={handleExportPDF}
    />
  );
}