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
import { CalendarIcon, Upload, Plus, Trash2, Save, UserPlus, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const employeeSchema = z.object({
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

export default function AddEmployeeForm({ onSave, onCancel }: AddEmployeeFormProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
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

  const onSubmit = (data: EmployeeFormData) => {
    // Validate at least one next of kin is primary
    const hasPrimaryNextOfKin = data.nextOfKin.some(nok => nok.primary);
    if (!hasPrimaryNextOfKin) {
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

    onSave?.(data);
    toast({
      title: "Employee Added",
      description: "Employee record has been successfully created.",
    });
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
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()}>
              <Save className="w-4 h-4 mr-2" />
              Save Employee
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Section A</TabsTrigger>
                <TabsTrigger value="family">Section B</TabsTrigger>
                <TabsTrigger value="education">Section C</TabsTrigger>
                <TabsTrigger value="nextofkin">Section D</TabsTrigger>
                <TabsTrigger value="declaration">Section E</TabsTrigger>
              </TabsList>

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

              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["personal", "family", "education", "nextofkin", "declaration"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                  disabled={activeTab === "personal"}
                >
                  Previous
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["personal", "family", "education", "nextofkin", "declaration"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  disabled={activeTab === "declaration"}
                >
                  Next
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}