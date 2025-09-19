import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAvailableUsers } from "@/hooks/useAvailableUsers";

const quickEmployeeSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  nameFull: z.string().min(1, "Full name is required"),
  nationalId: z.string().min(1, "National ID is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  contactAddress: z.string().min(1, "Contact address is required"),
  mobilePhone: z.string().min(1, "Mobile phone is required"),
  designation: z.string().min(1, "Designation is required"),
  placeOfWork: z.string().min(1, "Place of work is required"),
  nationality: z.string().min(1, "Nationality is required"),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  dateOfAppointment: z.string().min(1, "Date of appointment is required"),
  maritalStatus: z.string().min(1, "Marital status is required"),
  fatherName: z.string().min(1, "Father's name is required"),
  motherName: z.string().min(1, "Mother's name is required"),
});

type QuickEmployeeFormData = z.infer<typeof quickEmployeeSchema>;

interface QuickAddEmployeeFormProps {
  onSave: (data?: any) => void;
  onCancel: () => void;
}

export default function QuickAddEmployeeForm({ onSave, onCancel }: QuickAddEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users, loading: usersLoading } = useAvailableUsers();
  
  const form = useForm<QuickEmployeeFormData>({
    resolver: zodResolver(quickEmployeeSchema),
    defaultValues: {
      maritalStatus: "single",
      nationality: "Tanzanian",
      dateOfAppointment: new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data: QuickEmployeeFormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare data for RPC function
      const profileData = {
        name_full: data.nameFull,
        national_id: data.nationalId,
        employee_id: data.employeeId,
        contact_address: data.contactAddress,
        mobile_phone: data.mobilePhone,
        mobile_phones: [data.mobilePhone],
        designation: data.designation,
        place_of_work: data.placeOfWork,
        nationality: data.nationality,
        place_of_birth: data.placeOfBirth,
        date_of_birth: data.dateOfBirth,
        date_of_appointment: data.dateOfAppointment,
        marital_status: data.maritalStatus,
        father_name: data.fatherName,
        father_place_of_birth: data.placeOfBirth,
        father_nationality: data.nationality,
        mother_name: data.motherName,
        mother_place_of_birth: data.placeOfBirth,
        mother_nationality: data.nationality,
        terms_of_service: "contract",
        user_role: "employee",
        status: "active"
      };

      const { data: result, error } = await supabase.rpc('admin_create_employee_profile', {
        p_user_id: data.userId,
        p_profile_data: profileData
      });

      if (error) {
        console.error('RPC Error:', error);
        toast.error('Failed to create employee profile: ' + error.message);
        return;
      }

      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        toast.error('Failed to create employee profile: ' + (result as any).error);
        return;
      }

      // Update user role to employee
      const { error: roleError } = await supabase.rpc('admin_assign_role', {
        target_user_id: data.userId,
        new_role: 'employee'
      });

      if (roleError) {
        console.warn('Role assignment warning:', roleError);
        toast.warning('Profile created but role assignment failed: ' + roleError.message);
      }

      toast.success('Employee profile created successfully!');
      onSave(data);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quick Add Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select User Account</Label>
            <Select 
              value={form.watch("userId")} 
              onValueChange={(value) => form.setValue("userId", value)}
              disabled={usersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a user"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.userId && (
              <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameFull">Full Name *</Label>
              <Input
                id="nameFull"
                {...form.register("nameFull")}
                placeholder="John Doe"
              />
              {form.formState.errors.nameFull && (
                <p className="text-sm text-destructive">{form.formState.errors.nameFull.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID *</Label>
              <Input
                id="nationalId"
                {...form.register("nationalId")}
                placeholder="National ID number"
              />
              {form.formState.errors.nationalId && (
                <p className="text-sm text-destructive">{form.formState.errors.nationalId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                {...form.register("employeeId")}
                placeholder="EMP001"
              />
              {form.formState.errors.employeeId && (
                <p className="text-sm text-destructive">{form.formState.errors.employeeId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobilePhone">Mobile Phone *</Label>
              <Input
                id="mobilePhone"
                {...form.register("mobilePhone")}
                placeholder="+255 123 456 789"
              />
              {form.formState.errors.mobilePhone && (
                <p className="text-sm text-destructive">{form.formState.errors.mobilePhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                {...form.register("designation")}
                placeholder="Software Engineer"
              />
              {form.formState.errors.designation && (
                <p className="text-sm text-destructive">{form.formState.errors.designation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeOfWork">Place of Work *</Label>
              <Input
                id="placeOfWork"
                {...form.register("placeOfWork")}
                placeholder="Headquarters"
              />
              {form.formState.errors.placeOfWork && (
                <p className="text-sm text-destructive">{form.formState.errors.placeOfWork.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality *</Label>
              <Input
                id="nationality"
                {...form.register("nationality")}
                placeholder="Tanzanian"
              />
              {form.formState.errors.nationality && (
                <p className="text-sm text-destructive">{form.formState.errors.nationality.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeOfBirth">Place of Birth *</Label>
              <Input
                id="placeOfBirth"
                {...form.register("placeOfBirth")}
                placeholder="Dar es Salaam"
              />
              {form.formState.errors.placeOfBirth && (
                <p className="text-sm text-destructive">{form.formState.errors.placeOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...form.register("dateOfBirth")}
              />
              {form.formState.errors.dateOfBirth && (
                <p className="text-sm text-destructive">{form.formState.errors.dateOfBirth.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfAppointment">Date of Appointment *</Label>
              <Input
                id="dateOfAppointment"
                type="date"
                {...form.register("dateOfAppointment")}
              />
              {form.formState.errors.dateOfAppointment && (
                <p className="text-sm text-destructive">{form.formState.errors.dateOfAppointment.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Marital Status *</Label>
              <Select 
                value={form.watch("maritalStatus")} 
                onValueChange={(value) => form.setValue("maritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.maritalStatus && (
                <p className="text-sm text-destructive">{form.formState.errors.maritalStatus.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherName">Father's Name *</Label>
              <Input
                id="fatherName"
                {...form.register("fatherName")}
                placeholder="Father's full name"
              />
              {form.formState.errors.fatherName && (
                <p className="text-sm text-destructive">{form.formState.errors.fatherName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherName">Mother's Name *</Label>
              <Input
                id="motherName"
                {...form.register("motherName")}
                placeholder="Mother's full name"
              />
              {form.formState.errors.motherName && (
                <p className="text-sm text-destructive">{form.formState.errors.motherName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Address */}
          <div className="space-y-2">
            <Label htmlFor="contactAddress">Contact Address *</Label>
            <Input
              id="contactAddress"
              {...form.register("contactAddress")}
              placeholder="P.O. Box 123, Dar es Salaam"
            />
            {form.formState.errors.contactAddress && (
              <p className="text-sm text-destructive">{form.formState.errors.contactAddress.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}