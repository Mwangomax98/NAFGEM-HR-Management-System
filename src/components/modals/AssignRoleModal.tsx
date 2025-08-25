import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, AppRole } from "@/lib/roles";

interface User {
  id: string;
  full_name: string;
  email: string;
  roles?: { role: string }[];
}

interface AssignRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onRoleAssigned: () => void;
}

export default function AssignRoleModal({ open, onOpenChange, user, onRoleAssigned }: AssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const roles = [
    { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN], description: ROLE_DESCRIPTIONS[ROLES.ADMIN] },
    { value: ROLES.HR, label: ROLE_LABELS[ROLES.HR], description: ROLE_DESCRIPTIONS[ROLES.HR] },
    { value: ROLES.EMPLOYEE, label: ROLE_LABELS[ROLES.EMPLOYEE], description: ROLE_DESCRIPTIONS[ROLES.EMPLOYEE] },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !user) {
      toast({
        title: "Error",
        description: "Please select a role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (existingRole?.role === selectedRole) {
        toast({
          title: "Info",
          description: `User already has the ${selectedRole} role`,
        });
        onOpenChange(false);
        return;
      }

      // Update existing role or insert new one
      const { error } = await supabase
        .from("user_roles")
        .upsert({
          user_id: user.id,
          role: selectedRole as AppRole,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Role ${selectedRole} assigned to ${user.full_name}`,
      });
      
      setSelectedRole("");
      onRoleAssigned();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRole = (user: User | null) => {
    if (!user?.roles || user.roles.length === 0) return "No role assigned";
    return user.roles[0].role;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Role</DialogTitle>
          <DialogDescription>
            Assign a role to {user?.full_name} ({user?.email})
          </DialogDescription>
        </DialogHeader>
        
        {user && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div>
                <Badge variant="secondary">{getCurrentRole(user)}</Badge>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">New Role *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Assigning..." : "Assign Role"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}