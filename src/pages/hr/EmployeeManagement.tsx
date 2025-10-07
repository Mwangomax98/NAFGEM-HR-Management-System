import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Users, Plus, Search, Filter, Mail, Phone, Edit, Trash2, Eye, UserCheck, Clock, Building, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import QuickAddEmployeeForm from "@/components/employee/QuickAddEmployeeForm";
import EmployeeProfile from "@/components/employee/EmployeeProfile";
import EditProfileModal from "@/components/modals/EditProfileModal";
import { useAllEmployeeProfiles } from "@/hooks/useEmployeeProfile";
import { useEmployeeProfileUpdate } from "@/hooks/useEmployeeProfileUpdate";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeNotifications } from "@/hooks/useEmployeeNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";

export default function EmployeeManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { profiles, loading, error, refetch, applyLocalUpdate } = useAllEmployeeProfiles();
  const { updateEmployeeProfile, isLoading: isUpdating } = useEmployeeProfileUpdate();
  const { toast } = useToast();
  
  // Users without employee profiles (available to create)
  const { users: availableUsers, loading: loadingAvailable, error: availableError, refetch: refetchAvailable } = useAvailableUsers();
  
  // Set up employee notifications
  useEmployeeNotifications();

  const handleCreateProfile = async (user: { id: string; email: string; full_name: string | null; project: string | null; title: string | null; }) => {
    try {
      const profileData = {
        name_full: user.full_name || user.email.split("@")[0],
        designation: user.title || "Unknown",
        place_of_work: user.project || "Unknown"
      };

      const { data, error } = await supabase.rpc('admin_create_employee_profile', {
        p_user_id: user.id,
        p_profile_data: profileData
      });

      if (error) throw error;

      toast({ title: "Profile Created", description: `Employee profile created for ${user.full_name || user.email}.` });
      // Refresh both lists
      refetch();
      refetchAvailable();
    } catch (err: any) {
      console.error('Error creating employee profile:', err);
      toast({ title: "Creation Failed", description: err.message || "Could not create profile.", variant: "destructive" });
    }
  };
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

  // Transform database format to component format (normalize types and casing)
  const transformEmployeeData = (employee: any) => {
    const toDate = (d: any) => (d ? new Date(d) : undefined);
    const titleCase = (s?: string) =>
      (s || "")
        .toString()
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    const roleTitle = (r?: string) => {
      const v = (r || "").toLowerCase();
      if (v === "hr") return "HR";
      if (v === "admin") return "Admin";
      return "Employee";
    };

    const children = (employee.children || []).map((c: any) => ({
      name: c.name || "",
      sex: c.sex || "",
      dateOfBirth: toDate(c.dateOfBirth || c.date_of_birth) as Date,
    }));

    const education = (employee.education || []).map((e: any) => ({
      institution: e.institution || "",
      place: e.place || "",
      fromDate: toDate(e.fromDate || e.from_date) as Date,
      toDate: toDate(e.toDate || e.to_date) as Date,
      certificateUrls: e.certificateUrls || e.certificate_urls || [],
    }));

    const nextOfKin = (employee.next_of_kin || []).map((k: any) => ({
      name: k.name || "",
      age: Number(k.age) || 0,
      relation: k.relation || "",
      contact: k.contact || "",
      primary: !!k.primary,
    }));

    const projects = (employee.projects || []).map((p: any) => ({
      projectId: p.projectId ?? p.project_id,
      projectName: p.projectName ?? p.project_name ?? "",
      donor: p.donor || "",
      code: p.code || "",
      isPrimary: Boolean(p.isPrimary ?? p.is_primary),
    }));

    return {
      id: employee.id, // Include database ID for updates
      user_id: employee.user_id, // Include user_id for uploads
      personal: {
        nameFull: employee.name_full,
        nationalId: employee.national_id,
        tinNo: employee.tin_no || "",
        contactAddress: employee.contact_address,
        mobilePhones: employee.mobile_phones || [],
        designation: employee.designation,
        placeOfWork: employee.place_of_work,
        dateOfAppointment: toDate(employee.date_of_appointment) as Date,
        termsOfService: titleCase(employee.terms_of_service),
        nationality: employee.nationality,
        dateOfBirth: toDate(employee.date_of_birth) as Date,
        placeOfBirth: employee.place_of_birth,
        religion: employee.religion || "",
        maritalStatus: titleCase(employee.marital_status),
        spouseName: employee.spouse_name || "",
        spouseContacts: employee.spouse_contacts || "",
        passportPhotoUrl: employee.passport_photo_url || "/placeholder.svg",
      },
      family: {
        fatherName: employee.father_name,
        fatherPlaceOfBirth: employee.father_place_of_birth,
        fatherNationality: employee.father_nationality,
        motherName: employee.mother_name,
        motherPlaceOfBirth: employee.mother_place_of_birth,
        motherNationality: employee.mother_nationality,
        children,
      },
      education,
      nextOfKin,
      declaration: {
        text: employee.declaration_text,
        signedBy: employee.declaration_signed_by,
        signedAt: toDate(employee.declaration_signed_at) as Date,
      },
      employment: {
        employeeId: employee.employee_id,
        dateOfAppointment: toDate(employee.date_of_appointment) as Date,
        userRole: roleTitle(employee.user_role),
        status: titleCase(employee.status),
        projects,
      },
    };
  };

  const handleViewProfile = (employee: any) => {
    const transformedEmployee = transformEmployeeData(employee);
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

  const handleEditEmployee = (employee: any) => {
    const transformedEmployee = transformEmployeeData(employee);
    setSelectedEmployee(transformedEmployee);
    setShowEditModal(true);
  };

  // Keep the open view dialog in sync when profiles update
  useEffect(() => {
    if (!selectedEmployee?.id) return;
    const latest = profiles.find((p) => p.id === selectedEmployee.id);
    if (latest) {
      setSelectedEmployee(transformEmployeeData(latest));
    }
  }, [profiles, selectedEmployee?.id]);

  const handleUpdateEmployee = async (updatedEmployee: any) => {
    try {
      if (!selectedEmployee?.id) {
        throw new Error('Employee ID is missing');
      }

      const updated = await updateEmployeeProfile(selectedEmployee.id, updatedEmployee);
      
      // Apply local update immediately for instant UI feedback
      if (updated && applyLocalUpdate) {
        applyLocalUpdate(updated);
      }
      
      // Update selected employee to show changes in view dialog
      const transformedUpdated = transformEmployeeData(updated);
      setSelectedEmployee(transformedUpdated);
      
      setShowEditModal(false);
      toast({
        title: "Profile Updated",
        description: "Employee profile has been successfully updated.",
      });
      
      // Background refetch for consistency
      refetch();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee profile.",
        variant: "destructive",
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

        {/* Users Without Profiles */}
        {availableUsers.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-600">Users Without Employee Profiles</CardTitle>
              <CardDescription>Create employee profiles for users who don't have them yet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableUsers.map((user) => (
                  <div key={user.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.title}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateProfile(user)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Create Profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditEmployee(employee)}
                        >
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

      {/* Edit Employee Profile Modal */}
      {selectedEmployee && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEmployee(null);
          }}
          employee={selectedEmployee}
          onSave={handleUpdateEmployee}
        />
      )}
    </div>
  );
}