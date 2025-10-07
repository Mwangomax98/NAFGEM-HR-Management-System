import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Users, Briefcase, GraduationCap, Heart, Plus, X, CalendarIcon, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const employeeEditSchema = z.object({
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
  education: z.array(z.object({
    institution: z.string().min(1, "Institution is required"),
    place: z.string().min(1, "Place is required"),
    fromDate: z.date(),
    toDate: z.date(),
    certificateUrls: z.array(z.string()).optional(),
  })),
  nextOfKin: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().min(1, "Age is required"),
    relation: z.string().min(1, "Relation is required"),
    contact: z.string().min(1, "Contact is required"),
    primary: z.boolean().default(false),
  })).optional().default([]),
  declaration: z.object({
    text: z.string().optional(),
    signedBy: z.string().optional(),
    signedAt: z.date().optional(),
  }).optional(),
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
    })).optional().default([]),
  }),
});

type EmployeeEditFormData = z.infer<typeof employeeEditSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSave: (employee: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, employee, onSave }: EditProfileModalProps) {
  const { toast } = useToast();
  const form = useForm<EmployeeEditFormData>({
    resolver: zodResolver(employeeEditSchema),
    defaultValues: {
      personal: {
        nameFull: "",
        nationalId: "",
        tinNo: "",
        contactAddress: "",
        mobilePhones: [""],
        designation: "",
        placeOfWork: "",
        dateOfAppointment: new Date(),
        termsOfService: "Pensionable",
        nationality: "",
        dateOfBirth: new Date(),
        placeOfBirth: "",
        religion: "",
        maritalStatus: "Single",
        spouseName: "",
        spouseContacts: "",
        passportPhotoUrl: "",
      },
      family: {
        fatherName: "",
        fatherPlaceOfBirth: "",
        fatherNationality: "",
        motherName: "",
        motherPlaceOfBirth: "",
        motherNationality: "",
        children: [],
      },
      education: [],
      nextOfKin: [],
      employment: {
        employeeId: "",
        userRole: "Employee",
        status: "Active",
        projects: [],
      },
      declaration: {
        text: "I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.",
        signedBy: "",
        signedAt: new Date(),
      },
    },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: "personal.mobilePhones" as any,
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

  useEffect(() => {
    if (employee) {
      const parseDate = (dateStr: any) => {
        if (!dateStr) return new Date();
        return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
      };

      const capitalizeEnum = (value: string): any => {
        if (!value) return value;
        const capitalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        // Map database values to form enum values
        if (value.toLowerCase() === 'on leave') return 'On Leave';
        return capitalized;
      };

      form.reset({
        personal: {
          nameFull: employee.personal?.nameFull || "",
          nationalId: employee.personal?.nationalId || "",
          tinNo: employee.personal?.tinNo || "",
          contactAddress: employee.personal?.contactAddress || "",
          mobilePhones: Array.isArray(employee.personal?.mobilePhones) 
            ? employee.personal.mobilePhones 
            : employee.personal?.mobilePhones 
              ? [employee.personal.mobilePhones]
              : [""],
          designation: employee.personal?.designation || "",
          placeOfWork: employee.personal?.placeOfWork || "",
          dateOfAppointment: parseDate(employee.personal?.dateOfAppointment),
          termsOfService: (capitalizeEnum(employee.personal?.termsOfService) || "Pensionable") as "Pensionable" | "Temporary" | "Secondment" | "Contract",
          nationality: employee.personal?.nationality || "",
          dateOfBirth: parseDate(employee.personal?.dateOfBirth),
          placeOfBirth: employee.personal?.placeOfBirth || "",
          religion: employee.personal?.religion || "",
          maritalStatus: (capitalizeEnum(employee.personal?.maritalStatus) || "Single") as "Single" | "Married",
          spouseName: employee.personal?.spouseName || "",
          spouseContacts: employee.personal?.spouseContacts || "",
          passportPhotoUrl: employee.personal?.passportPhotoUrl || "",
        },
        family: {
          fatherName: employee.family?.fatherName || "",
          fatherPlaceOfBirth: employee.family?.fatherPlaceOfBirth || "",
          fatherNationality: employee.family?.fatherNationality || "",
          motherName: employee.family?.motherName || "",
          motherPlaceOfBirth: employee.family?.motherPlaceOfBirth || "",
          motherNationality: employee.family?.motherNationality || "",
          children: (employee.family?.children || []).map((child: any) => ({
            name: child.name,
            sex: child.sex,
            dateOfBirth: parseDate(child.dateOfBirth),
            birthCertificateUrl: child.birthCertificateUrl || "",
          })),
        },
        education: (employee.education || []).map((edu: any) => ({
          institution: edu.institution,
          place: edu.place,
          fromDate: parseDate(edu.fromDate),
          toDate: parseDate(edu.toDate),
          certificateUrls: edu.certificateUrls || [],
        })),
        nextOfKin: (employee.nextOfKin || []).map((kin: any) => ({
          name: kin.name,
          age: kin.age,
          relation: kin.relation,
          contact: kin.contact,
          primary: kin.primary || false,
        })),
        employment: {
          employeeId: employee.employment?.employeeId || "",
          userRole: (capitalizeEnum(employee.employment?.userRole) || "Employee") as "Employee" | "HR" | "Admin",
          status: (capitalizeEnum(employee.employment?.status) || "Active") as "Active" | "On Leave" | "Inactive",
          projects: (employee.employment?.projects || []).map((proj: any) => ({
            projectId: proj.projectId,
            projectName: proj.projectName,
            donor: proj.donor,
            code: proj.code,
            isPrimary: proj.isPrimary || false,
          })),
        },
        declaration: {
          text: employee.declaration?.text || "I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.",
          signedBy: employee.declaration?.signedBy || employee.personal?.nameFull || "",
          signedAt: parseDate(employee.declaration?.signedAt),
        },
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: any) => {
    try {
      await onSave(data);
      toast({
        title: "Success",
        description: "Employee profile updated successfully",
      });
      onClose();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update employee profile",
        variant: "destructive",
      });
    }
  };

  const onError = (errors: any) => {
    const errorCount = Object.keys(errors).length;
    toast({
      title: "Validation Error",
      description: `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} before saving`,
      variant: "destructive",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Employee Profile</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameFull">Full Name *</Label>
                    <Input id="nameFull" {...form.register("personal.nameFull", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">National ID *</Label>
                    <Input id="nationalId" {...form.register("personal.nationalId", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tinNo">TIN Number</Label>
                    <Input id="tinNo" {...form.register("personal.tinNo")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input id="designation" {...form.register("personal.designation", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeOfWork">Place of Work *</Label>
                    <Input id="placeOfWork" {...form.register("personal.placeOfWork", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input id="nationality" {...form.register("personal.nationality", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !form.watch("personal.dateOfBirth") && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("personal.dateOfBirth") ? (
                            format(form.watch("personal.dateOfBirth"), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.watch("personal.dateOfBirth")}
                          onSelect={(date) => form.setValue("personal.dateOfBirth", date || new Date())}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {form.formState.errors.personal?.dateOfBirth && (
                      <p className="text-sm text-destructive">{form.formState.errors.personal.dateOfBirth.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">Place of Birth *</Label>
                    <Input id="placeOfBirth" {...form.register("personal.placeOfBirth", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="religion">Religion</Label>
                    <Input id="religion" {...form.register("personal.religion")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status *</Label>
                    <Select value={form.watch("personal.maritalStatus")} onValueChange={(value) => form.setValue("personal.maritalStatus", value as "Single" | "Married")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactAddress">Contact Address *</Label>
                  <Textarea id="contactAddress" {...form.register("personal.contactAddress", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Phones *</Label>
                  {phoneFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input 
                        {...form.register(`personal.mobilePhones.${index}`)} 
                        placeholder="+255 XXX XXX XXX" 
                      />
                      {phoneFields.length > 1 && (
                        <Button type="button" variant="outline" size="icon" onClick={() => removePhone(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPhone("" as any)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Phone
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportPhotoUrl">Passport Photo URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="passportPhotoUrl" 
                      {...form.register("personal.passportPhotoUrl")} 
                      placeholder="Upload or enter URL"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {form.watch("personal.maritalStatus") === "Married" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="spouseName">Spouse Name</Label>
                      <Input id="spouseName" {...form.register("personal.spouseName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouseContacts">Spouse Contacts</Label>
                      <Input id="spouseContacts" {...form.register("personal.spouseContacts")} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Employment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID *</Label>
                    <Input id="employeeId" {...form.register("employment.employeeId", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfAppointment">Date of Appointment *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.watch("personal.dateOfAppointment") && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("personal.dateOfAppointment") ? format(form.watch("personal.dateOfAppointment"), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={form.watch("personal.dateOfAppointment")} onSelect={(date) => form.setValue("personal.dateOfAppointment", date || new Date())} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termsOfService">Terms of Service *</Label>
                    <Select value={form.watch("personal.termsOfService")} onValueChange={(value) => form.setValue("personal.termsOfService", value as "Pensionable" | "Temporary" | "Secondment" | "Contract")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pensionable">Pensionable</SelectItem>
                        <SelectItem value="Temporary">Temporary</SelectItem>
                        <SelectItem value="Secondment">Secondment</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={form.watch("employment.status")} onValueChange={(value) => form.setValue("employment.status", value as "Active" | "On Leave" | "Inactive")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userRole">Role *</Label>
                    <Select value={form.watch("employment.userRole")} onValueChange={(value) => form.setValue("employment.userRole", value as "Employee" | "HR" | "Admin")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Employee">Employee</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Projects *</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendProject({ projectId: "", projectName: "", donor: "", code: "", isPrimary: false })}>
                      <Plus className="w-4 h-4 mr-1" /> Add Project
                    </Button>
                  </div>
                  {projectFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Project ID *</Label>
                          <Input {...form.register(`employment.projects.${index}.projectId`)} placeholder="Project ID" />
                        </div>
                        <div className="space-y-2">
                          <Label>Project Name *</Label>
                          <Input {...form.register(`employment.projects.${index}.projectName`)} placeholder="Project name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Donor *</Label>
                          <Input {...form.register(`employment.projects.${index}.donor`)} placeholder="Donor name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Code *</Label>
                          <Input {...form.register(`employment.projects.${index}.code`)} placeholder="Project code" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            checked={form.watch(`employment.projects.${index}.isPrimary`)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                projectFields.forEach((_, i) => {
                                  if (i !== index) {
                                    form.setValue(`employment.projects.${i}.isPrimary`, false);
                                  }
                                });
                              }
                              form.setValue(`employment.projects.${index}.isPrimary`, !!checked);
                            }}
                          />
                          <Label>Primary Project</Label>
                        </div>
                        <div className="flex justify-end items-end">
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeProject(index)}>
                            <X className="w-4 h-4 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Family Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Family Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name *</Label>
                    <Input id="fatherName" {...form.register("family.fatherName", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherPlaceOfBirth">Father's Place of Birth *</Label>
                    <Input id="fatherPlaceOfBirth" {...form.register("family.fatherPlaceOfBirth", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fatherNationality">Father's Nationality *</Label>
                    <Input id="fatherNationality" {...form.register("family.fatherNationality", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name *</Label>
                    <Input id="motherName" {...form.register("family.motherName", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherPlaceOfBirth">Mother's Place of Birth *</Label>
                    <Input id="motherPlaceOfBirth" {...form.register("family.motherPlaceOfBirth", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motherNationality">Mother's Nationality *</Label>
                    <Input id="motherNationality" {...form.register("family.motherNationality", { required: true })} />
                  </div>
                </div>

                {/* Children */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Children</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendChild({ name: "", sex: "Male", dateOfBirth: new Date(), birthCertificateUrl: "" })}>
                      <Plus className="w-4 h-4 mr-1" /> Add Child
                    </Button>
                  </div>
                  {childrenFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Child Name *</Label>
                          <Input {...form.register(`family.children.${index}.name`)} placeholder="Child's name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Sex *</Label>
                          <RadioGroup 
                            value={form.watch(`family.children.${index}.sex`)}
                            onValueChange={(value) => form.setValue(`family.children.${index}.sex`, value as "Male" | "Female")}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Male" id={`sex-male-${index}`} />
                                <Label htmlFor={`sex-male-${index}`}>Male</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Female" id={`sex-female-${index}`} />
                                <Label htmlFor={`sex-female-${index}`}>Female</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-2">
                          <Label>Date of Birth *</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.watch(`family.children.${index}.dateOfBirth`) && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {form.watch(`family.children.${index}.dateOfBirth`) ? format(form.watch(`family.children.${index}.dateOfBirth`), "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar mode="single" selected={form.watch(`family.children.${index}.dateOfBirth`)} onSelect={(date) => form.setValue(`family.children.${index}.dateOfBirth`, date || new Date())} initialFocus />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label>Birth Certificate URL</Label>
                          <Input {...form.register(`family.children.${index}.birthCertificateUrl`)} placeholder="Certificate URL" />
                        </div>
                        <div className="flex justify-end items-end md:col-span-2">
                          <Button type="button" variant="destructive" size="sm" onClick={() => removeChild(index)}>
                            <X className="w-4 h-4 mr-1" /> Remove Child
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Education</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Education History</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({ institution: "", place: "", fromDate: new Date(), toDate: new Date(), certificateUrls: [] })}>
                    <Plus className="w-4 h-4 mr-1" /> Add Education
                  </Button>
                </div>
                {educationFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Institution *</Label>
                        <Input {...form.register(`education.${index}.institution`)} placeholder="Institution" />
                      </div>
                      <div className="space-y-2">
                        <Label>Place *</Label>
                        <Input {...form.register(`education.${index}.place`)} placeholder="Place" />
                      </div>
                      <div className="space-y-2">
                        <Label>From Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.watch(`education.${index}.fromDate`) && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch(`education.${index}.fromDate`) ? format(form.watch(`education.${index}.fromDate`), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={form.watch(`education.${index}.fromDate`)} onSelect={(date) => form.setValue(`education.${index}.fromDate`, date || new Date())} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label>To Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.watch(`education.${index}.toDate`) && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch(`education.${index}.toDate`) ? format(form.watch(`education.${index}.toDate`), "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={form.watch(`education.${index}.toDate`)} onSelect={(date) => form.setValue(`education.${index}.toDate`, date || new Date())} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex justify-end items-end md:col-span-2">
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeEducation(index)}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Next of Kin */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>Next of Kin</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Next of Kin Contacts</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendNextOfKin({ name: "", age: 0, relation: "", contact: "", primary: false })}>
                    <Plus className="w-4 h-4 mr-1" /> Add Next of Kin
                  </Button>
                </div>
                {nextOfKinFields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input {...form.register(`nextOfKin.${index}.name`)} placeholder="Name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Age *</Label>
                        <Input type="number" {...form.register(`nextOfKin.${index}.age`, { valueAsNumber: true })} placeholder="Age" />
                      </div>
                      <div className="space-y-2">
                        <Label>Relation *</Label>
                        <Input {...form.register(`nextOfKin.${index}.relation`)} placeholder="Relation" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact *</Label>
                        <Input {...form.register(`nextOfKin.${index}.contact`)} placeholder="Contact" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          checked={form.watch(`nextOfKin.${index}.primary`)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              nextOfKinFields.forEach((_, i) => {
                                if (i !== index) {
                                  form.setValue(`nextOfKin.${i}.primary`, false);
                                }
                              });
                            }
                            form.setValue(`nextOfKin.${index}.primary`, !!checked);
                          }}
                        />
                        <Label>Primary Contact</Label>
                      </div>
                      <div className="flex justify-end items-end">
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeNextOfKin(index)}>
                          <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Declaration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Declaration</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Declaration Text</Label>
                  <Textarea 
                    {...form.register("declaration.text")} 
                    rows={4}
                    defaultValue="I hereby declare that the information provided above is true and correct to the best of my knowledge and belief."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Signed By</Label>
                    <Input {...form.register("declaration.signedBy")} placeholder="Signed by" />
                  </div>
                  <div className="space-y-2">
                    <Label>Signed At</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.watch("declaration.signedAt") && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.watch("declaration.signedAt") ? format(form.watch("declaration.signedAt"), "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={form.watch("declaration.signedAt")} onSelect={(date) => form.setValue("declaration.signedAt", date || new Date())} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
