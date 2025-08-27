import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, AppRole } from "@/lib/roles";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [error, setError] = useState<string>("");
  const { toast } = useToast();
  const { userRole: currentUserRole } = useUserRole();

  // Filter roles based on current user's permissions
  const getAvailableRoles = () => {
    const allRoles = [
      { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN], description: ROLE_DESCRIPTIONS[ROLES.ADMIN] },
      { value: ROLES.HR, label: ROLE_LABELS[ROLES.HR], description: ROLE_DESCRIPTIONS[ROLES.HR] },
      { value: ROLES.EMPLOYEE, label: ROLE_LABELS[ROLES.EMPLOYEE], description: ROLE_DESCRIPTIONS[ROLES.EMPLOYEE] },
    ];
    
    // Only admins can assign admin roles
    if (currentUserRole !== 'admin') {
      return allRoles.filter(role => role.value !== ROLES.ADMIN);
    }
    
    return allRoles;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!selectedRole || !user) {
      setError("Please select a role");
      return;
    }

    // Client-side permission check
    if (currentUserRole !== 'admin' && selectedRole === ROLES.ADMIN) {
      setError("Only administrators can assign admin roles");
      return;
    }

    if (currentUserRole !== 'admin' && currentUserRole !== 'hr') {
      setError("You don't have permission to assign roles");
      return;
    }

    setIsLoading(true);
    
    // Debug: Check current authentication status
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Session status:", session ? "authenticated" : "not authenticated");
    console.log("Session user:", session?.user?.email);
    
    if (!session?.user) {
      setError("Authentication session expired. Please refresh the page and log in again.");
      setIsLoading(false);
      return;
    }
    
    try {
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

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

      if (error) {
        // Provide more specific error messages
        let errorMessage = "Failed to assign role";
        
        if (error.message.includes("Insufficient permissions")) {
          errorMessage = "You don't have permission to assign this role";
        } else if (error.message.includes("Rate limit exceeded")) {
          errorMessage = "Too many role assignments. Please wait before trying again";
        } else if (error.message.includes("violates row-level security")) {
          errorMessage = "Access denied. You don't have permission to assign roles";
        } else if (error.message.includes("admin")) {
          errorMessage = "Only administrators can assign admin roles";
        }
        
        setError(errorMessage);
        return;
      }

      toast({
        title: "Success",
        description: `Role ${ROLE_LABELS[selectedRole as AppRole]} assigned to ${user.full_name}`,
      });
      
      setSelectedRole("");
      setError("");
      onRoleAssigned();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Role assignment error:", error);
      setError(error.message || "Failed to assign role");
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
            
            {currentUserRole && currentUserRole !== 'employee' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="role">New Role *</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((role) => (
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
            ) : (
              <Alert>
                <AlertDescription>
                  You don't have permission to assign roles. Contact your administrator.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}