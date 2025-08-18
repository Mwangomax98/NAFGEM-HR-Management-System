import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Plus, Search, Filter, Mail, Phone, Edit, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import AddEmployeeForm from "@/components/employee/AddEmployeeForm";
import EmployeeProfile from "@/components/employee/EmployeeProfile";

export default function EmployeeManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [employees] = useState([]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "on-leave":
        return <Badge variant="secondary">On Leave</Badge>;
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Employee Management</h1>
          <p className="text-muted-foreground">Manage employee records and information</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              Active workforce
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {employees.filter(e => e.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {employees.filter(e => e.status === "on-leave").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Temporarily away
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(employees.map(e => e.department)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Complete list of all employees</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search employees..."
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No employees found. Click "Add Employee" to register your first employee.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {employee.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-sm">
                          <Mail className="w-3 h-3" />
                          <span className="text-muted-foreground">{employee.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="w-3 h-3" />
                          <span className="text-muted-foreground">{employee.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(employee.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(employee.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowProfile(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <AddEmployeeForm
            onSave={(data) => {
              console.log("Employee data:", data);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Employee Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeProfile
              employee={{
                personal: {
                  nameFull: selectedEmployee.name.toUpperCase(),
                  nationalId: "***********234",
                  contactAddress: "Contact address placeholder",
                  mobilePhones: [selectedEmployee.phone],
                  designation: selectedEmployee.position,
                  placeOfWork: "NAFGEM Headquarters",
                  dateOfAppointment: new Date(selectedEmployee.joinDate),
                  termsOfService: "Contract",
                  nationality: "Country",
                  dateOfBirth: new Date("1990-01-01"),
                  placeOfBirth: "City, Country",
                  maritalStatus: "Single",
                },
                family: {
                  fatherName: "Father Name",
                  fatherPlaceOfBirth: "Place",
                  fatherNationality: "Nationality",
                  motherName: "Mother Name", 
                  motherPlaceOfBirth: "Place",
                  motherNationality: "Nationality",
                },
                education: [
                  {
                    institution: "University Name",
                    place: "City",
                    fromDate: new Date("2010-01-01"),
                    toDate: new Date("2014-01-01"),
                  }
                ],
                nextOfKin: [
                  {
                    name: "Next of Kin",
                    age: 30,
                    relation: "Sibling",
                    contact: "+1234567890",
                    primary: true,
                  }
                ],
                declaration: {
                  text: "I hereby declare that the information provided is true.",
                  signedBy: selectedEmployee.name,
                  signedAt: new Date(),
                },
                employment: {
                  employeeId: `EMP${selectedEmployee.id.toString().padStart(6, '0')}`,
                  userRole: "Employee",
                  status: selectedEmployee.status === "active" ? "Active" : selectedEmployee.status === "on-leave" ? "On Leave" : "Inactive",
                  projects: [
                    {
                      projectName: `${selectedEmployee.department} Project`,
                      donor: "Donor Name",
                      code: `PROJ-${selectedEmployee.id}`,
                      isPrimary: true,
                    }
                  ],
                },
              }}
              canEdit={true}
              onEdit={() => {
                setShowProfile(false);
                // Open edit form
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}