import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Users, 
  GraduationCap, 
  Heart,
  Download,
  Edit,
  Building2,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface EmployeeData {
  personal: {
    nameFull: string;
    nationalId: string;
    tinNo?: string;
    contactAddress: string;
    mobilePhones: string[];
    designation: string;
    placeOfWork: string;
    dateOfAppointment: Date;
    termsOfService: string;
    nationality: string;
    dateOfBirth: Date;
    placeOfBirth: string;
    religion?: string;
    maritalStatus: string;
    spouseName?: string;
    spouseContacts?: string;
    passportPhotoUrl?: string;
  };
  family: {
    fatherName: string;
    fatherPlaceOfBirth: string;
    fatherNationality: string;
    motherName: string;
    motherPlaceOfBirth: string;
    motherNationality: string;
    children?: Array<{
      name: string;
      sex: string;
      dateOfBirth: Date;
    }>;
  };
  education: Array<{
    institution: string;
    place: string;
    fromDate: Date;
    toDate: Date;
  }>;
  nextOfKin: Array<{
    name: string;
    age: number;
    relation: string;
    contact: string;
    primary: boolean;
  }>;
  declaration: {
    text: string;
    signedBy: string;
    signedAt: Date;
  };
  employment: {
    employeeId: string;
    userRole: string;
    status: string;
    projects: Array<{
      projectName: string;
      donor: string;
      code: string;
      isPrimary: boolean;
    }>;
  };
}

interface EmployeeProfileProps {
  employee: EmployeeData;
  canEdit?: boolean;
  onEdit?: () => void;
  onExportPDF?: () => void;
}

export default function EmployeeProfile({ employee, canEdit = false, onEdit, onExportPDF }: EmployeeProfileProps) {
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      "Active": "bg-teal text-white",
      "On Leave": "bg-secondary text-secondary-foreground",
      "Inactive": "bg-destructive text-destructive-foreground"
    };
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles] || "bg-muted"}>
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      "Admin": "bg-crimson text-white",
      "HR": "bg-navy text-white",
      "Employee": "bg-slate text-white"
    };
    return (
      <Badge className={roleStyles[role as keyof typeof roleStyles] || "bg-muted"}>
        <Shield className="w-3 h-3 mr-1" />
        {role}
      </Badge>
    );
  };

  const primaryProject = employee.employment.projects.find(p => p.isPrimary);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary">Employee Profile</h1>
            <p className="text-muted-foreground">Personal Particulars</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            {canEdit && (
              <Button onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={employee.personal.passportPhotoUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {employee.personal.nameFull.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-heading font-bold text-primary">
                    {employee.personal.nameFull}
                  </h2>
                  {getStatusBadge(employee.employment.status)}
                  {getRoleBadge(employee.employment.userRole)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">{employee.employment.employeeId}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Title:</span>
                    <span className="font-medium">{employee.personal.designation}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{employee.personal.mobilePhones[0]}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium">{format(employee.personal.dateOfAppointment, "MMM yyyy")}</span>
                  </div>
                </div>

                {primaryProject && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="bg-teal/10 text-teal border-teal">
                      Primary Project: {primaryProject.projectName} ({primaryProject.code})
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section A - Personal Particulars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <User className="w-5 h-5" />
              <span>Section A - Personal Particulars</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Full Name</h4>
                  <p className="font-medium">{employee.personal.nameFull}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">National ID</h4>
                  <p className="font-medium">{employee.personal.nationalId}</p>
                </div>
                
                {employee.personal.tinNo && (
                  <div>
                    <h4 className="font-medium text-muted-foreground mb-1">TIN No.</h4>
                    <p className="font-medium">{employee.personal.tinNo}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Nationality</h4>
                  <p className="font-medium">{employee.personal.nationality}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Contact Address</h4>
                  <p className="font-medium">{employee.personal.contactAddress}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Mobile Phone(s)</h4>
                  <div className="space-y-1">
                    {employee.personal.mobilePhones.map((phone, index) => (
                      <p key={index} className="font-medium">{phone}</p>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Place of Work</h4>
                  <p className="font-medium">{employee.personal.placeOfWork}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Date of Birth</h4>
                  <p className="font-medium">{format(employee.personal.dateOfBirth, "PPP")}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Place of Birth</h4>
                  <p className="font-medium">{employee.personal.placeOfBirth}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Terms of Service</h4>
                  <Badge variant="outline">{employee.personal.termsOfService}</Badge>
                </div>
                
                <div>
                  <h4 className="font-medium text-muted-foreground mb-1">Marital Status</h4>
                  <p className="font-medium">{employee.personal.maritalStatus}</p>
                  {employee.personal.maritalStatus === "Married" && employee.personal.spouseName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Spouse: {employee.personal.spouseName}
                      {employee.personal.spouseContacts && ` (${employee.personal.spouseContacts})`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B - Family Particulars */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Users className="w-5 h-5" />
              <span>Section B - Family Particulars</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Father's Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-primary">Father's Information</h4>
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-medium">{employee.family.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Place of Birth: </span>
                    <span className="font-medium">{employee.family.fatherPlaceOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nationality: </span>
                    <span className="font-medium">{employee.family.fatherNationality}</span>
                  </div>
                </div>
              </div>

              {/* Mother's Information */}
              <div className="space-y-3">
                <h4 className="font-medium text-primary">Mother's Information</h4>
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <div>
                    <span className="text-muted-foreground">Name: </span>
                    <span className="font-medium">{employee.family.motherName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Place of Birth: </span>
                    <span className="font-medium">{employee.family.motherPlaceOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nationality: </span>
                    <span className="font-medium">{employee.family.motherNationality}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Children Information */}
            {employee.family.children && employee.family.children.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h4 className="font-medium text-primary">Children</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Sex</TableHead>
                        <TableHead>Date of Birth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employee.family.children.map((child, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{child.name}</TableCell>
                          <TableCell>{child.sex}</TableCell>
                          <TableCell>{format(child.dateOfBirth, "PPP")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section C - Education Qualification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <GraduationCap className="w-5 h-5" />
              <span>Section C - Education Qualification</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School/Institution</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employee.education.map((edu, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{edu.institution}</TableCell>
                    <TableCell>{edu.place}</TableCell>
                    <TableCell>{format(edu.fromDate, "MMM yyyy")}</TableCell>
                    <TableCell>{format(edu.toDate, "MMM yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section D - Next of Kin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Heart className="w-5 h-5" />
              <span>Section D - Next of Kin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Relation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Primary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employee.nextOfKin.map((nok, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{nok.name}</TableCell>
                    <TableCell>{nok.age}</TableCell>
                    <TableCell>{nok.relation}</TableCell>
                    <TableCell>{nok.contact}</TableCell>
                    <TableCell>
                      {nok.primary && <Badge variant="outline" className="bg-teal/10 text-teal">Primary</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section E - Declaration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <FileText className="w-5 h-5" />
              <span>Section E - Declaration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{employee.declaration.text}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Signed by:</p>
                  <p className="font-medium">{employee.declaration.signedBy}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Date:</p>
                  <p className="font-medium">{format(employee.declaration.signedAt, "PPP")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-primary">
              <Building2 className="w-5 h-5" />
              <span>Project Assignments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.employment.projects.map((project, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{project.projectName}</h4>
                      {project.isPrimary && (
                        <Badge className="bg-teal text-white">Primary</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Donor: {project.donor}</p>
                      <p>Code: {project.code}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}