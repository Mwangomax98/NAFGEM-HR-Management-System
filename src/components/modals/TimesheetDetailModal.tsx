import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, User, FileText, Download } from "lucide-react";
import { format } from "date-fns";

interface TimesheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export function TimesheetDetailModal({ isOpen, onClose, timesheet }: TimesheetDetailModalProps) {
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

  const dailyEntries = [
    { day: "Monday", hours: 8, project: "Website Redesign", notes: "Frontend development" },
    { day: "Tuesday", hours: 8, project: "Mobile App", notes: "Bug fixes and testing" },
    { day: "Wednesday", hours: 7, project: "Website Redesign", notes: "Backend integration" },
    { day: "Thursday", hours: 9, project: "Mobile App", notes: "Feature implementation" },
    { day: "Friday", hours: 8, project: "Website Redesign", notes: "Code review and deployment" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-3">
              {dailyEntries.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{entry.day}</span>
                          <Badge variant="outline">{entry.hours}h</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.project}</p>
                        <p className="text-sm">{entry.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {timesheet.status === "pending" && (
                <Button variant="outline">
                  Edit Timesheet
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}