import { useState } from "react";
import EmployeeProfile from "@/components/employee/EmployeeProfile";

// Employee data will be loaded from Supabase
const mockEmployee = {
  personal: {
    nameFull: "YOUR NAME",
    nationalId: "Not set",
    tinNo: "Not set",
    contactAddress: "Please update your profile information",
    mobilePhones: ["Not set"],
    designation: "Employee",
    placeOfWork: "NAFGEM",
    dateOfAppointment: new Date(),
    termsOfService: "Contract",
    nationality: "Tanzania",
    dateOfBirth: new Date("1990-01-01"),
    placeOfBirth: "Not set",
    religion: "Not set",
    maritalStatus: "Not set",
    spouseName: "Not set",
    spouseContacts: "Not set",
    passportPhotoUrl: "/placeholder.svg",
  },
  family: {
    fatherName: "Not set",
    fatherPlaceOfBirth: "Not set",
    fatherNationality: "Not set",
    motherName: "Not set",
    motherPlaceOfBirth: "Not set",
    motherNationality: "Not set",
    children: [],
  },
  education: [],
  nextOfKin: [],
  declaration: {
    text: "Please complete your profile information.",
    signedBy: "Pending",
    signedAt: new Date(),
  },
  employment: {
    employeeId: "Pending",
    userRole: "Employee",
    status: "Active",
    projects: [],
  },
};

export default function Profile() {
  const [employee] = useState(mockEmployee);

  const handleEdit = () => {
    console.log("Edit profile clicked");
    // Navigate to edit form or open edit modal
  };

  return (
    <EmployeeProfile
      employee={employee}
      canEdit={true}
      onEdit={handleEdit}
    />
  );
}