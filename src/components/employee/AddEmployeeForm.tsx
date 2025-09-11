import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, Plus, Trash2, Save, UserPlus, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserSelectionStep } from "./UserSelectionStep";

const employeeSchema = z.object({
  // User Selection
  selectedUserId: z.string().min(1, "User selection is required"),
  
  // Section A - Personal Particulars
  personal: z.object({
    nameFull: z.string().min(1, "Full name is required"),
    nationalId: z.string().min(1, "National ID is required"),
    tinNo: z.string().optional(),
    contactAddress: z.string().min(1, "Contact address is required"),
    mobilePhones: z.array(z.string()).min(1, "At least one phone number is required"),
    designation: z.string().min(1, "Designation is required"),
    placeOfWork: z.string().min(1, "Place of work is required"),
    dateOfAppointment: z.date({ required_error: "Date of appointment is required" }),
    termsOfService: z.enum(["Pensionable", "Temporary", "Secondment", "Contract"]),
    nationality: z.string().min(1, "Nationality is required"),
    dateOfBirth: z.date({ required_error: "Date of birth is required" }),
    placeOfBirth: z.string().min(1, "Place of birth is required"),
    religion: z.string().optional(),
    maritalStatus: z.enum(["Single", "Married"]),
    spouseName: z.string().optional(),
    spouseContacts: z.string().optional(),
    passportPhotoUrl: z.string().optional(),
  }),
  
  // Section B - Family Particulars
  family: z.object({
    fatherName: z.string().min(1, "Father's name is required"),
    fatherPlaceOfBirth: z.string().min(1, "Father's place of birth is required"),
    fatherNationality: z.string().min(1, "Father's nationality is required"),
    motherName: z.string().min(1, "Mother's name is required"),
    motherPlaceOfBirth: z.string().min(1, "Mother's place of birth is required"),
    motherNationality: z.string().min(1, "Mother's nationality is required"),
    children: z.array(z.object({
      name: z.string().min(1, "Child name is required"),
      sex: z.enum(["Male", "Female"]),
      dateOfBirth: z.date(),
      birthCertificateUrl: z.string().optional(),
    })).optional(),
  }),
  
  // Section C - Education Qualification
  education: z.array(z.object({
    institution: z.string().min(1, "Institution is required"),
    place: z.string().min(1, "Place is required"),
    fromDate: z.date(),
    toDate: z.date(),
    certificateUrls: z.array(z.string()).optional(),
  })),
  
  // Section D - Next of Kin
  nextOfKin: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().min(1, "Age is required"),
    relation: z.string().min(1, "Relation is required"),
    contact: z.string().min(1, "Contact is required"),
    primary: z.boolean().default(false),
  })).min(1, "At least one next of kin is required"),
  
  // Section E - Declaration
  declaration: z.object({
    text: z.string().min(1, "Declaration text is required"),
    signedBy: z.string().min(1, "Signature is required"),
    signedAt: z.date(),
  }),
  
  // System Fields
  employment: z.object({
    employeeId: z.string().min(1, "Employee ID is required"),
    userRole: z.enum(["Employee", "HR", "Admin"]),
    status: z.enum(["Active", "On Leave", "Inactive"]),
    projects: z.array(z.object({
      projectId: z.string(),
      projectName: z.string(),
      donor: z.string(),
      code: z.string(),
      isPrimary: z.boolean().default(false),
    })).min(1, "At least one project assignment is required"),
  }),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface AddEmployeeFormProps {
  onSave?: (data: EmployeeFormData) => void;
  onCancel?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  project: string | null;
  title: string | null;
}

export default function AddEmployeeForm({ onSave, onCancel }: AddEmployeeFormProps) {
  const [activeTab, setActiveTab] = useState("user-selection");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      selectedUserId: "",
      personal: {
        mobilePhones: [""],
        maritalStatus: "Single",
        termsOfService: "Contract",
      },
      family: {
        children: [],
      },
      education: [{ institution: "", place: "", fromDate: new Date(), toDate: new Date() }],
      nextOfKin: [{ name: "", age: 0, relation: "", contact: "", primary: true }],
      declaration: {
        text: "I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.",
        signedAt: new Date(),
        signedBy: "",
      },
      employment: {
        employeeId: `EMP${Date.now().toString().slice(-6)}`,
        userRole: "Employee",
        status: "Active",
        projects: [],
      },
    },
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: "family.children",
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control: form.control,
    name: "education",
  });

  const { fields: nextOfKinFields, append: appendNextOfKin, remove: removeNextOfKin } = useFieldArray({
    control: form.control,
    name: "nextOfKin",
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({
    control: form.control,
    name: "employment.projects",
  });

  const handleFileUpload = (fieldName: string, files: FileList | null) => {
    if (files) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldName]: Array.from(files),
      }));
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    console.log("🚀 Form submission started", data);
    setIsSubmitting(true);
    try {
      // Validate at least one next of kin is primary
      const hasPrimaryNextOfKin = data.nextOfKin.some(nok => nok.primary);
      console.log("Next of kin validation:", { nextOfKin: data.nextOfKin, hasPrimary: hasPrimaryNextOfKin });
      if (!hasPrimaryNextOfKin) {
        console.log("❌ Validation failed: No primary next of kin");
        toast({
          title: "Validation Error",
          description: "Please mark at least one next of kin as primary.",
          variant: "destructive",
        });
        return;
      }

      // Validate spouse fields if married
      if (data.personal.maritalStatus === "Married" && !data.personal.spouseName) {
        toast({
          title: "Validation Error",
          description: "Spouse name is required for married status.",
          variant: "destructive",
        });
        return;
      }

      // Check user permissions first
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError || !currentUser.user) {
        console.error('Authentication error:', userError);
        toast({
          title: "Authentication Error",
          description: "Please log in to continue.",
          variant: "destructive",
        });
        return;
      }

      console.log('Current user authenticated:', {
        id: currentUser.user.id,
        email: currentUser.user.email
      });

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.user.id)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        toast({
          title: "Permission Error",
          description: "Unable to verify permissions. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('User role:', userRole);

      if (!userRole || !['hr', 'admin'].includes(userRole.role)) {
        console.error('Insufficient permissions:', {
          userRole: userRole?.role,
          required: ['hr', 'admin']
        });
        toast({
          title: "Access Denied",
          description: "Only HR and Admin users can create employee profiles.",
          variant: "destructive",
        });
        return;
      }

      console.log('User has permission to create employees:', userRole.role);

      // Validate selected user
      if (!data.selectedUserId || !selectedUser) {
        toast({
          title: "Validation Error",
          description: "Please select a user to create an employee profile for.",
          variant: "destructive",
        });
        return;
      }

      // Transform form data to database format
      const employeeProfileData = {
        name_full: data.personal.nameFull,
        national_id: data.personal.nationalId,
        tin_no: data.personal.tinNo || null,
        contact_address: data.personal.contactAddress,
        mobile_phones: Array.isArray(data.personal.mobilePhones) ? data.personal.mobilePhones : [data.personal.mobilePhones].filter(Boolean),
        designation: data.personal.designation,
        place_of_work: data.personal.placeOfWork,
        date_of_appointment: data.personal.dateOfAppointment.toISOString().split('T')[0],
        terms_of_service: data.personal.termsOfService,
        nationality: data.personal.nationality,
        date_of_birth: data.personal.dateOfBirth.toISOString().split('T')[0],
        place_of_birth: data.personal.placeOfBirth,
        religion: data.personal.religion || null,
        marital_status: data.personal.maritalStatus,
        spouse_name: data.personal.spouseName || null,
        spouse_contacts: data.personal.spouseContacts || null,
        passport_photo_url: data.personal.passportPhotoUrl || null,
        father_name: data.family.fatherName,
        father_place_of_birth: data.family.fatherPlaceOfBirth,
        father_nationality: data.family.fatherNationality,
        mother_name: data.family.motherName,
        mother_place_of_birth: data.family.motherPlaceOfBirth,
        mother_nationality: data.family.motherNationality,
        children: JSON.parse(JSON.stringify(data.family.children?.map(child => ({
          ...child,
          dateOfBirth: child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString().split('T')[0] : child.dateOfBirth
        })) || [])),
        education: JSON.parse(JSON.stringify(data.education.map(edu => ({
          ...edu,
          fromDate: edu.fromDate instanceof Date ? edu.fromDate.toISOString().split('T')[0] : edu.fromDate,
          toDate: edu.toDate instanceof Date ? edu.toDate.toISOString().split('T')[0] : edu.toDate
        })))),
        next_of_kin: data.nextOfKin,
        declaration_text: data.declaration.text,
        declaration_signed_by: data.declaration.signedBy,
        declaration_signed_at: data.declaration.signedAt.toISOString().split('T')[0],
        employee_id: data.employment.employeeId,
        user_role: data.employment.userRole.toLowerCase(),
        status: 'active',
        projects: data.employment.projects || [],
        // Link to the selected user account
        user_id: data.selectedUserId,
        created_by: currentUser.user?.id
      };

      console.log('Attempting to save employee profile:', {
        employee_id: employeeProfileData.employee_id,
        name: employeeProfileData.name_full,
        user_role: userRole.role,
        mobile_phones: employeeProfileData.mobile_phones,
        children: employeeProfileData.children,
        projects: employeeProfileData.projects
      });

      // Insert the employee profile
      const { data: insertedProfile, error } = await supabase
        .from('employee_profiles')
        .insert(employeeProfileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating employee profile:', error);
        
        // Provide more specific error messages
        let errorMessage = "Failed to create employee profile.";
        if (error.message.includes("new row violates row-level security")) {
          errorMessage = "You don't have permission to create employee profiles. Please ensure you are logged in with HR or Admin privileges.";
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "An employee with this ID already exists.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      onSave?.(data);
      toast({
        title: "Employee Added",
        description: "Employee profile has been successfully created.",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (user: UserProfile | null) => {
    setSelectedUser(user);
    if (user) {
      form.setValue("selectedUserId", user.id);
      // Pre-populate name if available
      if (user.full_name) {
        form.setValue("personal.nameFull", user.full_name);
      }
    } else {
      form.setValue("selectedUserId", "");
    }
  };

  const handleUserSelectionNext = () => {
    if (selectedUser) {
      setActiveTab("personal");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-primary">Add Employee</h1>
            <p className="text-muted-foreground">Personal Particulars Form</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button 
              type="submit"
              form="employee-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Employee
                </>
              )}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form id="employee-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="user-selection">Select User</TabsTrigger>
                <TabsTrigger value="personal" disabled={!selectedUser}>Section A</TabsTrigger>
                <TabsTrigger value="family" disabled={!selectedUser}>Section B</TabsTrigger>
                <TabsTrigger value="education" disabled={!selectedUser}>Section C</TabsTrigger>
                <TabsTrigger value="nextofkin" disabled={!selectedUser}>Section D</TabsTrigger>
                <TabsTrigger value="declaration" disabled={!selectedUser}>Section E</TabsTrigger>
              </TabsList>

              {/* User Selection Step */}
              <TabsContent value="user-selection">
                <UserSelectionStep
                  selectedUserId={selectedUser?.id || null}
                  onUserSelect={handleUserSelect}
                  onNext={handleUserSelectionNext}
                />
              </TabsContent>

              {/* Section A - Personal Particulars */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Section A - Personal Particulars</CardTitle>
                    <CardDescription>Basic employee information and personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="personal.nameFull"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Name in Full</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter full name in CAPS" {...field} className="uppercase" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employment.employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>National ID No.</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.tinNo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TIN No.</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.contactAddress"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Contact Address</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.mobilePhones.0"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="+1 (555) 123-4567" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.designation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Designation/Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.placeOfWork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Place of Work</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.dateOfAppointment"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Appointment</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.termsOfService"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Terms of Service</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Pensionable" id="pensionable" />
                                  <Label htmlFor="pensionable">Pensionable</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Temporary" id="temporary" />
                                  <Label htmlFor="temporary">Temporary</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Secondment" id="secondment" />
                                  <Label htmlFor="secondment">Secondment</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Contract" id="contract" />
                                  <Label htmlFor="contract">Contract</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of Birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.placeOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Place of Birth</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.religion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="personal.maritalStatus"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Marital Status</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Single" id="single" />
                                  <Label htmlFor="single">Single</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Married" id="married" />
                                  <Label htmlFor="married">Married</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("personal.maritalStatus") === "Married" && (
                        <>
                          <FormField
                            control={form.control}
                            name="personal.spouseName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Spouse Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="personal.spouseContacts"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Spouse Contact(s)</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-2">
                            <Label>Marriage Certificate</Label>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.png"
                              onChange={(e) => handleFileUpload("marriageCertificate", e.target.files)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Passport Picture *</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => handleFileUpload("passportPhoto", e.target.files)}
                      />
                    </div>

                    {/* Projects Assignment */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Project Assignment</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendProject({ projectId: "", projectName: "", donor: "", code: "", isPrimary: false })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project
                        </Button>
                      </div>

                      {projectFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.projectName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.donor`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Donor</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.code`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center justify-between">
                              <FormField
                                control={form.control}
                                name={`employment.projects.${index}.isPrimary`}
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="rounded border-gray-300"
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm">Primary</FormLabel>
                                  </FormItem>
                                )}
                              />

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProject(index)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Continue with other sections... */}
              <TabsContent value="family" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Section B - Family Particulars</CardTitle>
                    <CardDescription>Information about parents and children</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Father's Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-primary">Father's Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="family.fatherName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="family.fatherPlaceOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Place of Birth</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="family.fatherNationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Father's Nationality</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Mother's Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-primary">Mother's Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="family.motherName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="family.motherPlaceOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Place of Birth</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="family.motherNationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mother's Nationality</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Children Information */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-primary">Children</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendChild({ name: "", sex: "Male", dateOfBirth: new Date() })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Child
                        </Button>
                      </div>

                      {childrenFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`family.children.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Child's Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`family.children.${index}.sex`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sex</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`family.children.${index}.dateOfBirth`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>Date of Birth</FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                          )}
                                        >
                                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date()}
                                        initialFocus
                                        className="pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <Label className="text-sm">Birth Certificate</Label>
                                <Input
                                  type="file"
                                  accept=".pdf,.jpg,.png"
                                  onChange={(e) => handleFileUpload(`childBirthCert_${index}`, e.target.files)}
                                  className="text-xs"
                                />
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeChild(index)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section C - Education Qualification */}
              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Section C - Education Qualification</CardTitle>
                    <CardDescription>Educational background and qualifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-primary">Education Records</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendEducation({ institution: "", place: "", fromDate: new Date(), toDate: new Date() })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>

                    {educationFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`education.${index}.institution`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Institution</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., University of Dar es Salaam" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`education.${index}.place`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Place</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Dar es Salaam, Tanzania" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`education.${index}.fromDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>From Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`education.${index}.toDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>To Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="md:col-span-2 flex items-center justify-between">
                            <div className="space-y-2 flex-1">
                              <Label className="text-sm">Certificates</Label>
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.png"
                                multiple
                                onChange={(e) => handleFileUpload(`educationCerts_${index}`, e.target.files)}
                                className="text-xs"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEducation(index)}
                              className="text-destructive ml-4"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section D - Next of Kin */}
              <TabsContent value="nextofkin" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Section D - Next of Kin</CardTitle>
                    <CardDescription>Emergency contacts and next of kin information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-primary">Next of Kin</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendNextOfKin({ name: "", age: 0, relation: "", contact: "", primary: false })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Next of Kin
                      </Button>
                    </div>

                    {nextOfKinFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`nextOfKin.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`nextOfKin.${index}.age`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`nextOfKin.${index}.relation`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Relation</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Parent, Sibling, Spouse" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`nextOfKin.${index}.contact`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Information</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Phone number or address" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center space-x-2">
                            <FormField
                              control={form.control}
                              name={`nextOfKin.${index}.primary`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="mt-1"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Primary Contact</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex items-center justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNextOfKin(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Section E - Declaration */}
              <TabsContent value="declaration" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Section E - Declaration</CardTitle>
                    <CardDescription>Employee declaration and signature</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="declaration.text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declaration Text</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              placeholder="I hereby declare that the information provided above is true and correct to the best of my knowledge and belief..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="declaration.signedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Signed By (Employee Name)</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="declaration.signedAt"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date Signed</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Project Assignments */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-primary">Project Assignments</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendProject({ projectId: "", projectName: "", donor: "", code: "", isPrimary: false })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project
                        </Button>
                      </div>

                      {projectFields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.projectId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project ID</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.projectName`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.donor`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Donor</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`employment.projects.${index}.code`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex items-center space-x-2">
                              <FormField
                                control={form.control}
                                name={`employment.projects.${index}.isPrimary`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value}
                                        onChange={field.onChange}
                                        className="mt-1"
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Primary Project</FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="flex items-center justify-end lg:col-span-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProject(index)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                {activeTab !== "user-selection" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const tabs = ["user-selection", "personal", "family", "education", "nextofkin", "declaration"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex > 0) {
                        setActiveTab(tabs[currentIndex - 1]);
                      }
                    }}
                    disabled={activeTab === "user-selection"}
                  >
                    Previous
                  </Button>
                )}

                {activeTab !== "declaration" && selectedUser && activeTab !== "user-selection" && (
                  <Button
                    type="button"
                    onClick={() => {
                      const tabs = ["user-selection", "personal", "family", "education", "nextofkin", "declaration"];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1]);
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}