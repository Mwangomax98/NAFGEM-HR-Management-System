import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Users, GraduationCap, Heart, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSave: (data: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, employee, onSave }: EditProfileModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      // Personal Details
      nameFull: employee.personal.nameFull,
      nationalId: employee.personal.nationalId,
      tinNo: employee.personal.tinNo || "",
      contactAddress: employee.personal.contactAddress,
      mobilePhones: employee.personal.mobilePhones.join(", "),
      designation: employee.personal.designation,
      placeOfWork: employee.personal.placeOfWork,
      nationality: employee.personal.nationality,
      dateOfBirth: new Date(employee.personal.dateOfBirth).toISOString().split('T')[0],
      placeOfBirth: employee.personal.placeOfBirth,
      religion: employee.personal.religion || "",
      maritalStatus: employee.personal.maritalStatus,
      spouseName: employee.personal.spouseName || "",
      spouseContacts: employee.personal.spouseContacts || "",
      // Family Details
      fatherName: employee.family.fatherName,
      fatherPlaceOfBirth: employee.family.fatherPlaceOfBirth,
      fatherNationality: employee.family.fatherNationality,
      motherName: employee.family.motherName,
      motherPlaceOfBirth: employee.family.motherPlaceOfBirth,
      motherNationality: employee.family.motherNationality,
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Transform the data back to the expected format
      const updatedEmployee = {
        ...employee,
        personal: {
          ...employee.personal,
          nameFull: data.nameFull,
          nationalId: data.nationalId,
          tinNo: data.tinNo,
          contactAddress: data.contactAddress,
          mobilePhones: data.mobilePhones.split(",").map((phone: string) => phone.trim()),
          designation: data.designation,
          placeOfWork: data.placeOfWork,
          nationality: data.nationality,
          dateOfBirth: new Date(data.dateOfBirth),
          placeOfBirth: data.placeOfBirth,
          religion: data.religion,
          maritalStatus: data.maritalStatus,
          spouseName: data.spouseName,
          spouseContacts: data.spouseContacts,
        },
        family: {
          ...employee.family,
          fatherName: data.fatherName,
          fatherPlaceOfBirth: data.fatherPlaceOfBirth,
          fatherNationality: data.fatherNationality,
          motherName: data.motherName,
          motherPlaceOfBirth: data.motherPlaceOfBirth,
          motherNationality: data.motherNationality,
        }
      };

      onSave(updatedEmployee);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Edit Profile</span>
          </DialogTitle>
        </DialogHeader>

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
                  <Label htmlFor="nameFull">Full Name</Label>
                  <Input
                    id="nameFull"
                    {...form.register("nameFull", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID</Label>
                  <Input
                    id="nationalId"
                    {...form.register("nationalId", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tinNo">TIN Number</Label>
                  <Input
                    id="tinNo"
                    {...form.register("tinNo")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    {...form.register("designation", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfWork">Place of Work</Label>
                  <Input
                    id="placeOfWork"
                    {...form.register("placeOfWork", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    {...form.register("nationality", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...form.register("dateOfBirth", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Place of Birth</Label>
                  <Input
                    id="placeOfBirth"
                    {...form.register("placeOfBirth", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    {...form.register("religion")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select 
                    value={form.watch("maritalStatus")} 
                    onValueChange={(value) => form.setValue("maritalStatus", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactAddress">Contact Address</Label>
                <Textarea
                  id="contactAddress"
                  rows={3}
                  {...form.register("contactAddress", { required: true })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobilePhones">Mobile Phones (comma separated)</Label>
                <Input
                  id="mobilePhones"
                  placeholder="e.g., +255 123 456 789, +255 987 654 321"
                  {...form.register("mobilePhones", { required: true })}
                />
              </div>

              {form.watch("maritalStatus") === "Married" && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spouseName">Spouse Name</Label>
                      <Input
                        id="spouseName"
                        {...form.register("spouseName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouseContacts">Spouse Contacts</Label>
                      <Input
                        id="spouseContacts"
                        {...form.register("spouseContacts")}
                      />
                    </div>
                  </div>
                </>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Father's Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-primary">Father's Information</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father's Name</Label>
                      <Input
                        id="fatherName"
                        {...form.register("fatherName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherPlaceOfBirth">Place of Birth</Label>
                      <Input
                        id="fatherPlaceOfBirth"
                        {...form.register("fatherPlaceOfBirth")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fatherNationality">Nationality</Label>
                      <Input
                        id="fatherNationality"
                        {...form.register("fatherNationality")}
                      />
                    </div>
                  </div>
                </div>

                {/* Mother's Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-primary">Mother's Information</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="motherName">Mother's Name</Label>
                      <Input
                        id="motherName"
                        {...form.register("motherName")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherPlaceOfBirth">Place of Birth</Label>
                      <Input
                        id="motherPlaceOfBirth"
                        {...form.register("motherPlaceOfBirth")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherNationality">Nationality</Label>
                      <Input
                        id="motherNationality"
                        {...form.register("motherNationality")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}