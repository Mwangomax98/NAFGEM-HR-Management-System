import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Users, Briefcase, GraduationCap, Heart, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSave: (employee: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, employee, onSave }: EditProfileModalProps) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      personal: {
        nameFull: "",
        nationalId: "",
        tinNo: "",
        contactAddress: "",
        mobilePhones: "",
        designation: "",
        placeOfWork: "",
        termsOfService: "contract",
        nationality: "",
        dateOfBirth: "",
        placeOfBirth: "",
        religion: "",
        maritalStatus: "single",
        spouseName: "",
        spouseContacts: "",
      },
      family: {
        fatherName: "",
        fatherPlaceOfBirth: "",
        fatherNationality: "",
        motherName: "",
        motherPlaceOfBirth: "",
        motherNationality: "",
      },
      children: [] as any[],
      education: [] as any[],
      nextOfKin: [] as any[],
      employment: {
        employeeId: "",
        dateOfAppointment: "",
        projects: [] as any[],
        userRole: "employee",
        status: "active",
      },
    },
  });

  const { fields: childrenFields, append: appendChild, remove: removeChild } = useFieldArray({
    control: form.control,
    name: "children",
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
      form.reset({
        personal: {
          ...employee.personal,
          termsOfService: employee.personal.termsOfService || "contract",
          maritalStatus: employee.personal.maritalStatus || "single",
        },
        family: employee.family || {},
        children: employee.family?.children || [],
        education: employee.education || [],
        nextOfKin: employee.nextOfKin || [],
        employment: {
          employeeId: employee.employment?.employeeId || "",
          dateOfAppointment: employee.employment?.dateOfAppointment || "",
          projects: employee.employment?.projects || [],
          userRole: employee.employment?.userRole || "employee",
          status: employee.employment?.status || "active",
        },
      });
    }
  }, [employee, form]);

  const onSubmit = (data: any) => {
    try {
      onSave(data);
      toast({
        title: "Success",
        description: "Employee profile updated successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Employee Profile</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    <Input id="dateOfBirth" type="date" {...form.register("personal.dateOfBirth", { required: true })} />
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
                    <Select value={form.watch("personal.maritalStatus")} onValueChange={(value) => form.setValue("personal.maritalStatus", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactAddress">Contact Address *</Label>
                  <Textarea id="contactAddress" {...form.register("personal.contactAddress", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobilePhones">Mobile Phones *</Label>
                  <Input id="mobilePhones" {...form.register("personal.mobilePhones", { required: true })} placeholder="Separate multiple numbers with commas" />
                </div>
                {form.watch("personal.maritalStatus") === "married" && (
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
                    <Input id="dateOfAppointment" type="date" {...form.register("employment.dateOfAppointment", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="termsOfService">Terms of Service *</Label>
                    <Select value={form.watch("personal.termsOfService")} onValueChange={(value) => form.setValue("personal.termsOfService", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={form.watch("employment.status")} onValueChange={(value) => form.setValue("employment.status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userRole">Role *</Label>
                    <Select value={form.watch("employment.userRole")} onValueChange={(value) => form.setValue("employment.userRole", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Projects</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendProject({ name: "" })}>
                      <Plus className="w-4 h-4 mr-1" /> Add Project
                    </Button>
                  </div>
                  {projectFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input {...form.register(`employment.projects.${index}.name`)} placeholder="Project name" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeProject(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => appendChild({ name: "", dateOfBirth: "" })}>
                      <Plus className="w-4 h-4 mr-1" /> Add Child
                    </Button>
                  </div>
                  {childrenFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-2 gap-2">
                      <Input {...form.register(`children.${index}.name`)} placeholder="Child's name" />
                      <div className="flex gap-2">
                        <Input type="date" {...form.register(`children.${index}.dateOfBirth`)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeChild(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
                  <Button type="button" variant="outline" size="sm" onClick={() => appendEducation({ institution: "", qualification: "", year: "" })}>
                    <Plus className="w-4 h-4 mr-1" /> Add Education
                  </Button>
                </div>
                {educationFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-2">
                    <Input {...form.register(`education.${index}.institution`)} placeholder="Institution" />
                    <Input {...form.register(`education.${index}.qualification`)} placeholder="Qualification" />
                    <div className="flex gap-2">
                      <Input {...form.register(`education.${index}.year`)} placeholder="Year" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeEducation(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
                  <Button type="button" variant="outline" size="sm" onClick={() => appendNextOfKin({ name: "", relationship: "", contact: "" })}>
                    <Plus className="w-4 h-4 mr-1" /> Add Next of Kin
                  </Button>
                </div>
                {nextOfKinFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-2">
                    <Input {...form.register(`nextOfKin.${index}.name`)} placeholder="Name" />
                    <Input {...form.register(`nextOfKin.${index}.relationship`)} placeholder="Relationship" />
                    <div className="flex gap-2">
                      <Input {...form.register(`nextOfKin.${index}.contact`)} placeholder="Contact" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeNextOfKin(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
