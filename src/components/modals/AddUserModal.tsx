import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { ROLES, getRoleLabel } from "@/lib/roles";

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const ROLE_OPTIONS = [
  ROLES.EMPLOYEE,
  ROLES.FIELD_OFFICER,
  ROLES.MANAGER,
  ROLES.HR_ADMIN,
  ROLES.SUPER_ADMIN,
];

export default function AddUserModal({ open, onOpenChange, onUserAdded }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    project: "",
    title: "",
    password: "",
    role: ROLES.EMPLOYEE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in name, email, and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await api.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        user_metadata: {
          full_name: formData.full_name,
          project: formData.project,
          title: formData.title,
        },
      });

      if (error) throw error;

      toast({
        title: "User created",
        description: `${formData.full_name} can now sign in at the login page.`,
      });

      setFormData({
        full_name: "",
        email: "",
        project: "",
        title: "",
        password: "",
        role: ROLES.EMPLOYEE,
      });
      onUserAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a staff login. Only admins can create accounts — there is no public registration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@nafgemtanzania.or.tz"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Temporary password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(role) => setFormData({ ...formData, role })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input
              id="project"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              placeholder="Optional project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Job title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Optional job title"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
