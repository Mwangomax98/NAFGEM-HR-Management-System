import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Check, X, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface TimesheetWithProfile {
  id: string;
  employee_id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  overtime_hours: number;
  status: string;
  submitted_at: string;
  notes?: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export default function TimesheetApprovals() {
  const [pendingTimesheets, setPendingTimesheets] = useState<TimesheetWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingTimesheets();
  }, []);

  const fetchPendingTimesheets = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          id,
          employee_id,
          week_start_date,
          week_end_date,
          total_hours,
          overtime_hours,
          status,
          submitted_at,
          notes,
          profiles (
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setPendingTimesheets((data as unknown as TimesheetWithProfile[]) || []);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast.error('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id: string, action: 'approve' | 'reject') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from('timesheets')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setPendingTimesheets(timesheets => 
        timesheets.filter(timesheet => timesheet.id !== id)
      );

      toast.success(`Timesheet ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      console.error('Error updating timesheet:', error);
      toast.error(error.message || `Failed to ${action} timesheet`);
    }
  };

  const pendingCount = pendingTimesheets.length;
  const totalHours = pendingTimesheets.reduce((sum, t) => sum + t.total_hours, 0);
  const totalOvertime = pendingTimesheets.reduce((sum, t) => sum + t.overtime_hours, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Timesheet Approvals</h1>
          <p className="text-muted-foreground">Review and approve employee timesheets</p>
        </div>
        <Badge variant="destructive" className="text-lg px-3 py-1">
          {pendingCount} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalOvertime}h</div>
            <p className="text-xs text-muted-foreground">
              Extra hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hours/Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingTimesheets.length > 0 ? Math.round(totalHours / pendingTimesheets.length) : 0}h
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly average
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Timesheet Approvals</CardTitle>
          <CardDescription>Review and approve or reject employee timesheets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Regular Hours</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Loading timesheets...
                  </TableCell>
                </TableRow>
              ) : pendingTimesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No timesheet submissions to review yet.
                  </TableCell>
                </TableRow>
              ) : (
                pendingTimesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {timesheet.profiles?.full_name?.slice(0, 2).toUpperCase() || 'UN'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{timesheet.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{timesheet.profiles?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(new Date(timesheet.week_start_date), 'MMM dd')} - {format(new Date(timesheet.week_end_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{timesheet.total_hours - timesheet.overtime_hours}h</TableCell>
                    <TableCell>
                      {timesheet.overtime_hours > 0 ? (
                        <span className="text-amber-600 font-medium">{timesheet.overtime_hours}h</span>
                      ) : (
                        "0h"
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{timesheet.total_hours}h</TableCell>
                    <TableCell>{new Date(timesheet.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleApproval(timesheet.id, 'approve')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleApproval(timesheet.id, 'reject')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}