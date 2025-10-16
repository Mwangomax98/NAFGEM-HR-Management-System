import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  full_name: string;
  email: string;
  roles?: { role: string }[];
}

interface DeleteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onDelete: (userId: string, userEmail: string) => void;
}

export default function DeleteUserModal({
  open,
  onOpenChange,
  user,
  onDelete,
}: DeleteUserModalProps) {
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await onDelete(user.id, user.email);
      setEmailConfirmation("");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setEmailConfirmation("");
    onOpenChange(false);
  };

  const isEmailMatch = emailConfirmation === user?.email;

  if (!user) return null;

  const userRole = user.roles?.[0]?.role || "No Role";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete User Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please confirm deletion.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Warning:</strong> This will permanently delete all data associated with this user account.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-sm font-medium">User Information</p>
              <p className="text-sm text-muted-foreground mt-1">{user.full_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className="mt-2">{userRole}</Badge>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">The following data will be permanently deleted:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>User account and authentication data</li>
                <li>Profile information</li>
                <li>Role assignments</li>
                <li>Employee profile (if exists)</li>
                <li>All associated records and history</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-confirm" className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">{user.email}</span> to confirm
            </Label>
            <Input
              id="email-confirm"
              type="text"
              value={emailConfirmation}
              onChange={(e) => setEmailConfirmation(e.target.value)}
              placeholder="Enter user's email to confirm"
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isEmailMatch || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
