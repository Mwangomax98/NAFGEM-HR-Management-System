import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, User, FileText, Download, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TimesheetEntry {
  id: string;
  entry_date: string;
  project_name: string;
  hours_worked: number;
  description?: string;
}

interface TimesheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onEdit?: (timesheet: any) => void;
  timesheet: {
    id: string;
    week_start_date: string;
    week_end_date: string;
    status: string;
    total_hours: number;
    overtime_hours: number;
    submitted_at: string;
    approved_by?: string;
    notes?: string;
  };
}

export function TimesheetDetailModal({ isOpen, onClose, onSuccess, onEdit, timesheet }: TimesheetDetailModalProps) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && timesheet.id) {
      fetchEntries();
    }
  }, [isOpen, timesheet.id]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('timesheet_entries')
        .select('*')
        .eq('timesheet_id', timesheet.id)
        .order('entry_date', { ascending: true });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching timesheet entries:', error);
      toast({
        title: "Error",
        description: "Failed to load timesheet entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this timesheet? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);

      // Delete entries first
      const { error: entriesError } = await supabase
        .from('timesheet_entries')
        .delete()
        .eq('timesheet_id', timesheet.id);

      if (entriesError) throw entriesError;

      // Delete attachments
      const { error: attachmentsError } = await supabase
        .from('timesheet_attachments')
        .delete()
        .eq('timesheet_id', timesheet.id);

      if (attachmentsError) throw attachmentsError;

      // Delete timesheet
      const { error: timesheetError } = await supabase
        .from('timesheets')
        .delete()
        .eq('id', timesheet.id);

      if (timesheetError) throw timesheetError;

      toast({
        title: "Success",
        description: "Timesheet deleted successfully",
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to delete timesheet",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Timesheet Details - {format(new Date(timesheet.week_start_date), 'MMM dd')} - {format(new Date(timesheet.week_end_date), 'MMM dd, yyyy')}
            {getStatusBadge(timesheet.status)}
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of hours worked during this period
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timesheet.total_hours}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overtime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timesheet.overtime_hours}h</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{timesheet.submitted_at ? new Date(timesheet.submitted_at).toLocaleDateString() : "Not submitted"}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved By</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{timesheet.approved_by || "Pending"}</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Daily Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading entries...
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No entries found for this timesheet
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {format(new Date(entry.entry_date), 'EEEE, MMMM dd')}
                            </span>
                            <Badge variant="outline">{entry.hours_worked}h</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{entry.project_name}</p>
                          {entry.description && (
                            <p className="text-sm">{entry.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
            <div className="flex gap-2">
              {(timesheet.status === "pending" || timesheet.status === "draft") && (
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {(timesheet.status === "pending" || timesheet.status === "draft") && onEdit && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    onEdit(timesheet);
                    onClose();
                  }}
                >
                  Edit Timesheet
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}