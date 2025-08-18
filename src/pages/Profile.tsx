import { useState } from "react";
import EmployeeProfile from "@/components/employee/EmployeeProfile";

// Mock employee data
const mockEmployee = {
  personal: {
    nameFull: "SARAH ELIZABETH JOHNSON",
    nationalId: "12345678901234",
    tinNo: "TIN987654321",
    contactAddress: "123 Main Street, Anytown, State 12345, Country",
    mobilePhones: ["+1 (555) 123-4567", "+1 (555) 987-6543"],
    designation: "Human Resources Manager",
    placeOfWork: "NAFGEM Headquarters",
    dateOfAppointment: new Date("2020-03-15"),
    termsOfService: "Pensionable",
    nationality: "American",
    dateOfBirth: new Date("1985-08-20"),
    placeOfBirth: "New York, USA",
    religion: "Christian",
    maritalStatus: "Married",
    spouseName: "Michael Johnson",
    spouseContacts: "+1 (555) 456-7890",
    passportPhotoUrl: "/placeholder.svg",
  },
  family: {
    fatherName: "Robert Smith",
    fatherPlaceOfBirth: "Boston, USA",
    fatherNationality: "American",
    motherName: "Linda Smith",
    motherPlaceOfBirth: "Chicago, USA",
    motherNationality: "American",
    children: [
      {
        name: "Emma Johnson",
        sex: "Female",
        dateOfBirth: new Date("2018-05-10"),
      },
      {
        name: "James Johnson",
        sex: "Male",
        dateOfBirth: new Date("2020-12-03"),
      },
    ],
  },
  education: [
    {
      institution: "Harvard University",
      place: "Cambridge, MA",
      fromDate: new Date("2003-09-01"),
      toDate: new Date("2007-06-15"),
    },
    {
      institution: "MIT Sloan School of Management",
      place: "Cambridge, MA",
      fromDate: new Date("2010-09-01"),
      toDate: new Date("2012-06-15"),
    },
  ],
  nextOfKin: [
    {
      name: "Michael Johnson",
      age: 38,
      relation: "Spouse",
      contact: "+1 (555) 456-7890",
      primary: true,
    },
    {
      name: "Robert Smith",
      age: 68,
      relation: "Father",
      contact: "+1 (555) 111-2222",
      primary: false,
    },
  ],
  declaration: {
    text: "I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that any false information may result in disciplinary action including termination of employment.",
    signedBy: "Sarah Elizabeth Johnson",
    signedAt: new Date("2020-03-15"),
  },
  employment: {
    employeeId: "EMP001234",
    userRole: "HR",
    status: "Active",
    projects: [
      {
        projectName: "Strategic HR Development",
        donor: "World Bank",
        code: "WB-HR-2024",
        isPrimary: true,
      },
      {
        projectName: "Capacity Building Initiative",
        donor: "USAID",
        code: "USAID-CB-2024",
        isPrimary: false,
      },
    ],
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