import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserProfile, useAvailableUsers } from '@/hooks/useAvailableUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuickAddEmployeeFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function QuickAddEmployeeForm({ onSave, onCancel }: QuickAddEmployeeFormProps) {
  const { users, loading: usersLoading } = useAvailableUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name_full: '',
    national_id: '',
    employee_id: '',
    contact_address: '',
    mobile_phone: '',
    designation: '',
    place_of_work: '',
    nationality: 'Tanzanian',
    place_of_birth: '',
    date_of_birth: '',
    date_of_appointment: '',
    marital_status: 'single',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setFormData(prev => ({
        ...prev,
        name_full: user.full_name || '',
        designation: user.title || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!formData.name_full || !formData.national_id || !formData.employee_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for RPC function
      const profileData = {
        name_full: formData.name_full,
        national_id: formData.national_id,
        employee_id: formData.employee_id,
        contact_address: formData.contact_address,
        mobile_phone: formData.mobile_phone,
        designation: formData.designation,
        place_of_work: formData.place_of_work,
        nationality: formData.nationality,
        place_of_birth: formData.place_of_birth,
        date_of_birth: formData.date_of_birth,
        date_of_appointment: formData.date_of_appointment,
        marital_status: formData.marital_status,
      };

      const { data, error } = await supabase.rpc('admin_create_employee_profile', {
        p_user_id: selectedUser.id,
        p_profile_data: profileData
      });

      if (error) {
        console.error('RPC Error:', error);
        toast.error(`Failed to create employee profile: ${error.message}`);
        return;
      }

      if (!(data as any)?.success) {
        toast.error((data as any)?.error || 'Failed to create employee profile');
        return;
      }

      toast.success('Employee profile created successfully');
      onSave();
    } catch (error: any) {
      console.error('Error creating employee profile:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Quick Add Employee</CardTitle>
        <CardDescription>
          Create a new employee profile with essential information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection */}
          <div className="space-y-2">
            <Label htmlFor="user">Select User *</Label>
            <Select onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to create employee profile for" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email} - {user.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_full">Full Name *</Label>
              <Input
                id="name_full"
                value={formData.name_full}
                onChange={(e) => setFormData(prev => ({ ...prev, name_full: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id">National ID *</Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                value={formData.designation}
                onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_address">Address</Label>
              <Input
                id="contact_address"
                value={formData.contact_address}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile_phone">Mobile Phone</Label>
              <Input
                id="mobile_phone"
                value={formData.mobile_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile_phone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_of_work">Place of Work</Label>
              <Input
                id="place_of_work"
                value={formData.place_of_work}
                onChange={(e) => setFormData(prev => ({ ...prev, place_of_work: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place_of_birth">Place of Birth</Label>
              <Input
                id="place_of_birth"
                value={formData.place_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, place_of_birth: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_appointment">Date of Appointment</Label>
              <Input
                id="date_of_appointment"
                type="date"
                value={formData.date_of_appointment}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_appointment: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select 
                value={formData.marital_status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value }))}
              >
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

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedUser}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Employee'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}