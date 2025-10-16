import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UserProfile, useAvailableUsers } from '@/hooks/useAvailableUsers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { RoleDiagnostics } from './RoleDiagnostics';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toTitleMarital, isMarried, toTitleTermsOfService } from '@/utils/marital';

interface QuickAddEmployeeFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export default function QuickAddEmployeeForm({ onSave, onCancel }: QuickAddEmployeeFormProps) {
  const { users, loading: usersLoading, error: usersError, refetch } = useAvailableUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name_full: '',
    national_id: '',
    employee_id: '',
    contact_address: '',
    mobile_phone: '',
    designation: '',
    place_of_work: '',
    terms_of_service: 'Contract',
    nationality: 'Tanzanian',
    place_of_birth: '',
    date_of_birth: '',
    date_of_appointment: '',
    marital_status: 'Single',
    // Section B - Family Particulars
    father_name: '',
    father_place_of_birth: '',
    father_nationality: '',
    mother_name: '',
    mother_place_of_birth: '',
    mother_nationality: '',
    children: [] as Array<{
      name: string;
      sex: string;
      date_of_birth: string;
    }>,
    // Section C - Education
    education: [] as Array<{
      institution: string;
      place: string;
      from_date: string;
      to_date: string;
    }>,
    // Section D - Next of Kin
    nextOfKin: [] as Array<{
      name: string;
      age: string;
      relation: string;
      contact: string;
      primary: boolean;
    }>,
    // Section E - Declaration & Projects
    declaration_text: 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.',
    declaration_signed_by: '',
    declaration_signed_at: '',
    projects: [] as Array<{
      projectId: string;
      projectName: string;
      donor: string;
      code: string;
      isPrimary: boolean;
    }>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addChild = () => {
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, { name: '', sex: 'Male', date_of_birth: '' }]
    }));
  };

  const removeChild = (index: number) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { institution: '', place: '', from_date: '', to_date: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addNextOfKin = () => {
    setFormData(prev => ({
      ...prev,
      nextOfKin: [...prev.nextOfKin, { name: '', age: '', relation: '', contact: '', primary: false }]
    }));
  };

  const removeNextOfKin = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nextOfKin: prev.nextOfKin.filter((_, i) => i !== index)
    }));
  };

  const updateNextOfKin = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      nextOfKin: prev.nextOfKin.map((kin, i) => 
        i === index ? { ...kin, [field]: value } : kin
      )
    }));
  };

  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, { projectId: '', projectName: '', donor: '', code: '', isPrimary: false }]
    }));
  };

  const removeProject = (index: number) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
  };

  const updateProject = (index: number, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map((project, i) => 
        i === index ? { ...project, [field]: value } : project
      )
    }));
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setFormData(prev => ({
        ...prev,
        name_full: user.full_name || '',
        designation: user.title || '',
        declaration_signed_by: user.full_name || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (!formData.name_full || !formData.national_id || !formData.employee_id || 
        !formData.father_name || !formData.mother_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Debug the form data before transformation
      console.log('=== QUICK ADD FORM DATA ===');
      console.log('Raw form data:', formData);
      
      // Prepare data for RPC function - ensure we pass actual values
      const profileData = {
        name_full: formData.name_full || '',
        national_id: formData.national_id || '',
        employee_id: formData.employee_id || '',
        contact_address: formData.contact_address || '',
        mobile_phones: formData.mobile_phone ? [formData.mobile_phone] : [],
        designation: formData.designation || '',
        place_of_work: formData.place_of_work || '',
        terms_of_service: toTitleTermsOfService(formData.terms_of_service),
        nationality: formData.nationality || '',
        place_of_birth: formData.place_of_birth || '',
        date_of_birth: formData.date_of_birth || new Date().toISOString().split('T')[0],
        date_of_appointment: formData.date_of_appointment || new Date().toISOString().split('T')[0],
        marital_status: toTitleMarital(formData.marital_status),
        spouse_name: !isMarried(formData.marital_status) ? null : (formData as any).spouse_name || null,
        spouse_contacts: !isMarried(formData.marital_status) ? null : (formData as any).spouse_contacts || null,
        father_name: formData.father_name || '',
        father_place_of_birth: formData.father_place_of_birth || '',
        father_nationality: formData.father_nationality || formData.nationality || '',
        mother_name: formData.mother_name || '',
        mother_place_of_birth: formData.mother_place_of_birth || '',
        mother_nationality: formData.mother_nationality || formData.nationality || '',
        children: formData.children || [],
        education: formData.education || [],
        next_of_kin: formData.nextOfKin || [],
        declaration_text: formData.declaration_text || 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.',
        declaration_signed_by: formData.declaration_signed_by || formData.name_full || 'System',
        declaration_signed_at: formData.declaration_signed_at || new Date().toISOString().split('T')[0],
        projects: formData.projects || [],
      };
      
      console.log('=== TRANSFORMED PROFILE DATA ===');
      console.log('Transformed data:', profileData);

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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quick Add Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoleDiagnostics />
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading available users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (usersError) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quick Add Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoleDiagnostics />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{usersError}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={refetch} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Users
            </Button>
            <Button onClick={onCancel} variant="secondary" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quick Add Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RoleDiagnostics />
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No users available to create employee profiles. All existing users already have employee profiles.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={refetch} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh User List
            </Button>
            <Button onClick={onCancel} variant="secondary" className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
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
              <Label htmlFor="terms_of_service">Terms of Service</Label>
              <Select 
                value={formData.terms_of_service} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, terms_of_service: value }))}
              >
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
              <Label htmlFor="marital_status">Marital Status</Label>
              <Select 
                value={formData.marital_status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, marital_status: value }))}
              >
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

          {/* Section B - Family Particulars */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Section B - Family Particulars</h3>
            
            {/* Father's Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="father_name">Father's Name *</Label>
                <Input
                  id="father_name"
                  value={formData.father_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, father_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_place_of_birth">Father's Place of Birth *</Label>
                <Input
                  id="father_place_of_birth"
                  value={formData.father_place_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, father_place_of_birth: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_nationality">Father's Nationality *</Label>
                <Input
                  id="father_nationality"
                  value={formData.father_nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, father_nationality: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Mother's Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mother_name">Mother's Name *</Label>
                <Input
                  id="mother_name"
                  value={formData.mother_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, mother_name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_place_of_birth">Mother's Place of Birth *</Label>
                <Input
                  id="mother_place_of_birth"
                  value={formData.mother_place_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, mother_place_of_birth: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_nationality">Mother's Nationality *</Label>
                <Input
                  id="mother_nationality"
                  value={formData.mother_nationality}
                  onChange={(e) => setFormData(prev => ({ ...prev, mother_nationality: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Children */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Children (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChild}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </div>
              
              {formData.children.map((child, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Child's Name</Label>
                    <Input
                      value={child.name}
                      onChange={(e) => updateChild(index, 'name', e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select value={child.sex} onValueChange={(value) => updateChild(index, 'sex', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={child.date_of_birth}
                      onChange={(e) => updateChild(index, 'date_of_birth', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => removeChild(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C - Education Qualification */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Section C - Education Qualification</h3>
              <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
            
            {formData.education.map((edu, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                    placeholder="School/University name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Place</Label>
                  <Input
                    value={edu.place}
                    onChange={(e) => updateEducation(index, 'place', e.target.value)}
                    placeholder="Location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input
                    type="date"
                    value={edu.from_date}
                    onChange={(e) => updateEducation(index, 'from_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input
                    type="date"
                    value={edu.to_date}
                    onChange={(e) => updateEducation(index, 'to_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2 flex items-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEducation(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {formData.education.length === 0 && (
              <p className="text-muted-foreground text-sm">No education records added yet. Click "Add Education" to add one.</p>
            )}
          </div>

          {/* Section D - Next of Kin */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Section D - Next of Kin</h3>
              <Button type="button" variant="outline" size="sm" onClick={addNextOfKin}>
                <Plus className="w-4 h-4 mr-2" />
                Add Next of Kin
              </Button>
            </div>
            
            {formData.nextOfKin.map((kin, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={kin.name}
                    onChange={(e) => updateNextOfKin(index, 'name', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    value={kin.age}
                    onChange={(e) => updateNextOfKin(index, 'age', e.target.value)}
                    placeholder="Age"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relation</Label>
                  <Input
                    value={kin.relation}
                    onChange={(e) => updateNextOfKin(index, 'relation', e.target.value)}
                    placeholder="Relationship"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact</Label>
                  <Input
                    value={kin.contact}
                    onChange={(e) => updateNextOfKin(index, 'contact', e.target.value)}
                    placeholder="Phone/Address"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      checked={kin.primary}
                      onCheckedChange={(checked) => updateNextOfKin(index, 'primary', checked as boolean)}
                    />
                    <Label className="text-sm">Primary Contact</Label>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => removeNextOfKin(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {formData.nextOfKin.length === 0 && (
              <p className="text-muted-foreground text-sm">No next of kin added yet. Click "Add Next of Kin" to add one.</p>
            )}
          </div>

          {/* Section E - Declaration & Projects */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Section E - Declaration & Projects</h3>
            
            {/* Declaration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="declaration_text">Declaration</Label>
                <Textarea
                  id="declaration_text"
                  value={formData.declaration_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, declaration_text: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="declaration_signed_by">Signed By</Label>
                  <Input
                    id="declaration_signed_by"
                    value={formData.declaration_signed_by}
                    onChange={(e) => setFormData(prev => ({ ...prev, declaration_signed_by: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="declaration_signed_at">Date Signed</Label>
                  <Input
                    id="declaration_signed_at"
                    type="date"
                    value={formData.declaration_signed_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, declaration_signed_at: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Project Assignments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Project Assignments</Label>
                <Button type="button" variant="outline" size="sm" onClick={addProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>
              
              {formData.projects.map((project, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Project ID</Label>
                    <Input
                      value={project.projectId}
                      onChange={(e) => updateProject(index, 'projectId', e.target.value)}
                      placeholder="Project ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={project.projectName}
                      onChange={(e) => updateProject(index, 'projectName', e.target.value)}
                      placeholder="Project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Donor</Label>
                    <Input
                      value={project.donor}
                      onChange={(e) => updateProject(index, 'donor', e.target.value)}
                      placeholder="Donor organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={project.code}
                      onChange={(e) => updateProject(index, 'code', e.target.value)}
                      placeholder="Project code"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 mt-6">
                      <Checkbox
                        checked={project.isPrimary}
                        onCheckedChange={(checked) => updateProject(index, 'isPrimary', checked as boolean)}
                      />
                      <Label className="text-sm">Primary Project</Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeProject(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {formData.projects.length === 0 && (
                <p className="text-muted-foreground text-sm">No projects assigned yet. Click "Add Project" to add one.</p>
              )}
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