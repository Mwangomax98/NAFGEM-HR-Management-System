import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, Plus, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { TimesheetDetailModal } from "@/components/modals/TimesheetDetailModal";
import { CreateTimesheetModal } from "@/components/modals/CreateTimesheetModal";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Timesheet {
  id: string;
  week_start_date: string;
  week_end_date: string;
  total_hours: number;
  overtime_hours: number;
  status: string;
  submitted_at: string;
  approved_by?: string;
  notes?: string;
}

export default function Timesheets() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [timesheetToEdit, setTimesheetToEdit] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    thisWeekHours: 0,
    thisMonthHours: 0,
    overtimeHours: 0,
    pendingCount: 0
  });

  useEffect(() => {
    fetchTimesheets();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('timesheets')
        .select('*')
        .eq('employee_id', user.id)
        .order('week_start_date', { ascending: false });

      if (error) throw error;

      setTimesheets(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (timesheetData: Timesheet[]) => {
    const now = new Date();
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1));
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let thisWeekHours = 0;
    let thisMonthHours = 0;
    let overtimeHours = 0;
    let pendingCount = 0;

    timesheetData.forEach(timesheet => {
      const weekStart = new Date(timesheet.week_start_date);
      
      if (weekStart >= currentWeekStart) {
        thisWeekHours += timesheet.total_hours;
      }
      
      if (weekStart >= currentMonthStart) {
        thisMonthHours += timesheet.total_hours;
        overtimeHours += timesheet.overtime_hours;
      }
      
      if (timesheet.status === 'pending') {
        pendingCount++;
      }
    });

    setStats({ thisWeekHours, thisMonthHours, overtimeHours, pendingCount });
  };

  const openTimesheetDetail = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setIsDetailModalOpen(true);
  };

  const handleEditTimesheet = (timesheet: Timesheet) => {
    setTimesheetToEdit(timesheet);
    setIsCreateModalOpen(true);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">My Timesheets</h1>
          <p className="text-muted-foreground">Track and manage your working hours</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Timesheet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeekHours}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisWeekHours === 0 ? "No hours logged yet" : "Hours logged this week"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthHours}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthHours === 0 ? "No hours logged yet" : "Hours logged this month"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overtimeHours}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.overtimeHours === 0 ? "No overtime yet" : "Overtime hours"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount === 0 ? "No pending timesheets" : "Awaiting HR review"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Your timesheet submission history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Loading timesheets...
                  </TableCell>
                </TableRow>
              ) : timesheets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No timesheets submitted yet. Click "New Timesheet" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">
                      {format(new Date(timesheet.week_start_date), 'MMM dd')} - {format(new Date(timesheet.week_end_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                    <TableCell>{timesheet.total_hours}h</TableCell>
                    <TableCell>{timesheet.overtime_hours}h</TableCell>
                    <TableCell>{timesheet.submitted_at ? new Date(timesheet.submitted_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{timesheet.approved_by || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openTimesheetDetail(timesheet)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateTimesheetModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setTimesheetToEdit(null);
        }}
        onSuccess={() => {
          fetchTimesheets();
          setTimesheetToEdit(null);
        }}
        timesheetToEdit={timesheetToEdit}
      />

      {selectedTimesheet && (
        <TimesheetDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onSuccess={fetchTimesheets}
          onEdit={handleEditTimesheet}
          timesheet={selectedTimesheet}
        />
      )}
    </div>
  );
}