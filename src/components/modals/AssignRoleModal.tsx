import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    { value: "admin", label: "Administrator", description: "Full system access" },
    { value: "hr", label: "HR Staff", description: "HR management access" },
    { value: "employee", label: "Employee", description: "Basic employee access" },
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
      // First, remove existing role if any
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Then add the new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: selectedRole as "admin" | "hr" | "employee",
        });

      if (insertError) throw insertError;

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