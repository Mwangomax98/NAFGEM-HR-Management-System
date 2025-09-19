import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Plus, Search, Filter, Mail, Phone, Edit, Trash2, Eye, UserCheck, Clock, Building, UserPlus } from "lucide-react";
import { useState } from "react";
import QuickAddEmployeeForm from "@/components/employee/QuickAddEmployeeForm";
import EmployeeProfile from "@/components/employee/EmployeeProfile";
import { useAllEmployeeProfiles } from "@/hooks/useEmployeeProfile";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeNotifications } from "@/hooks/useEmployeeNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function EmployeeManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const { profiles, loading, error, refetch } = useAllEmployeeProfiles();
  const { toast } = useToast();
  
  // Set up employee notifications
  useEmployeeNotifications();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "on_leave":
        return <Badge variant="secondary">On Leave</Badge>;
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewProfile = (employee: any) => {
    // Transform database format to component format
    const transformedEmployee = {
      personal: {
        nameFull: employee.name_full,
        nationalId: employee.national_id,
        tinNo: employee.tin_no || "Not set",
        contactAddress: employee.contact_address,
        mobilePhones: employee.mobile_phones,
        designation: employee.designation,
        placeOfWork: employee.place_of_work,
        dateOfAppointment: new Date(employee.date_of_appointment),
        termsOfService: employee.terms_of_service,
        nationality: employee.nationality,
        dateOfBirth: new Date(employee.date_of_birth),
        placeOfBirth: employee.place_of_birth,
        religion: employee.religion || "Not set",
        maritalStatus: employee.marital_status,
        spouseName: employee.spouse_name || "Not set",
        spouseContacts: employee.spouse_contacts || "Not set",
        passportPhotoUrl: employee.passport_photo_url || "/placeholder.svg",
      },
      family: {
        fatherName: employee.father_name,
        fatherPlaceOfBirth: employee.father_place_of_birth,
        fatherNationality: employee.father_nationality,
        motherName: employee.mother_name,
        motherPlaceOfBirth: employee.mother_place_of_birth,
        motherNationality: employee.mother_nationality,
        children: employee.children || [],
      },
      education: employee.education || [],
      nextOfKin: employee.next_of_kin || [],
      declaration: {
        text: employee.declaration_text,
        signedBy: employee.declaration_signed_by,
        signedAt: new Date(employee.declaration_signed_at),
      },
      employment: {
        employeeId: employee.employee_id,
        userRole: employee.user_role,
        status: employee.status,
        projects: employee.projects || [],
      },
    };
    
    setSelectedEmployee(transformedEmployee);
    setShowProfile(true);
  };

  const handleSaveEmployee = (employeeData?: any) => {
    // Close the form immediately since real-time updates will handle the refresh
    setShowAddForm(false);
    
    // Show success message with employee details
    if (employeeData) {
      toast({
        title: "Employee Added Successfully",
        description: `${employeeData.personal.nameFull} has been added to the system.`,
      });
    } else {
      toast({
        title: "Success",
        description: "Employee has been added successfully.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading employee profiles: {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary">Employee Management</h1>
            <p className="text-muted-foreground">Manage employee records and information</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{profiles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{profiles.filter(e => e.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                  <p className="text-2xl font-bold">{profiles.filter(e => e.status === "on_leave").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold">{new Set(profiles.flatMap(e => e.projects.map((p: any) => p.projectName))).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Directory */}

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>View and manage all employee records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Input
                placeholder="Search employees..."
                className="max-w-sm"
              />
              <Button variant="outline">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name_full}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{employee.mobile_phones?.[0] || "No phone"}</div>
                        <div className="text-sm text-muted-foreground">{employee.national_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(employee.date_of_appointment).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {getStatusBadge(employee.status)}
                    </TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProfile(employee)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add Employee Form Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Fill in the employee information below to create a new employee record.
            </DialogDescription>
          </DialogHeader>
          <QuickAddEmployeeForm
            onSave={() => setShowAddForm(false)}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
            <DialogDescription>
              Complete employee information and details
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeProfile
              employee={selectedEmployee}
              canEdit={true}
              onEdit={() => {
                setShowProfile(false);
                // TODO: Open edit form
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}