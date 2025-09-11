import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  project: string | null;
  title: string | null;
}

interface UserSelectionStepProps {
  selectedUserId: string | null;
  onUserSelect: (user: UserProfile | null) => void;
  onNext: () => void;
}

export function UserSelectionStep({ selectedUserId, onUserSelect, onNext }: UserSelectionStepProps) {
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId && availableUsers.length > 0) {
      const user = availableUsers.find(u => u.id === selectedUserId);
      setSelectedUser(user || null);
    }
  }, [selectedUserId, availableUsers]);

  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users from profiles table
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, project, title')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Get users who already have employee profiles
      const { data: existingEmployees, error: employeeError } = await supabase
        .from('employee_profiles')
        .select('user_id');

      if (employeeError) throw employeeError;

      // Filter out users who already have employee profiles
      const existingUserIds = new Set(existingEmployees?.map(emp => emp.user_id));
      const availableProfiles = allProfiles?.filter(profile => 
        profile.id && !existingUserIds.has(profile.id)
      ) || [];

      setAvailableUsers(availableProfiles);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast({
        title: "Error",
        description: "Failed to load available users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    setSelectedUser(user || null);
    onUserSelect(user || null);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    onUserSelect(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select User
          </CardTitle>
          <CardDescription>
            Loading available users...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            No Users Available
          </CardTitle>
          <CardDescription>
            All users in the system already have employee profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            To create a new employee profile, first add a new user account to the system.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Select User
        </CardTitle>
        <CardDescription>
          Choose a user account to create an employee profile for. Only users without existing employee profiles are shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Available Users</label>
          <Select value={selectedUser?.id || ""} onValueChange={handleUserSelection}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user to create employee profile for..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name || user.email}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Selected User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {selectedUser.full_name?.split(' ').map(n => n[0]).join('') || selectedUser.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{selectedUser.full_name || "No name set"}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                  <div className="flex gap-2">
                    {selectedUser.project && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedUser.project}
                      </Badge>
                    )}
                    {selectedUser.title && (
                      <Badge variant="outline" className="text-xs">
                        {selectedUser.title}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={onNext}
            disabled={!selectedUser}
            className="flex-1"
          >
            Continue with Selected User
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}