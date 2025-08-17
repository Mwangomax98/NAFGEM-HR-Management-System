import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Check, X, Eye } from "lucide-react";
import { useState } from "react";

export default function TimesheetApprovals() {
  const [pendingTimesheets, setPendingTimesheets] = useState([
    {
      id: 1,
      employeeName: "Michael Chen",
      employeeAvatar: "MC",
      week: "Nov 11-17, 2024",
      totalHours: 42,
      overtimeHours: 2,
      submittedDate: "2024-11-18",
      department: "Engineering",
      status: "pending"
    },
    {
      id: 2,
      employeeName: "Emily Rodriguez",
      employeeAvatar: "ER",
      week: "Nov 11-17, 2024",
      totalHours: 40,
      overtimeHours: 0,
      submittedDate: "2024-11-18",
      department: "Marketing",
      status: "pending"
    },
    {
      id: 3,
      employeeName: "David Thompson",
      employeeAvatar: "DT",
      week: "Nov 11-17, 2024",
      totalHours: 38,
      overtimeHours: 0,
      submittedDate: "2024-11-17",
      department: "Sales",
      status: "pending"
    }
  ]);

  const handleApproval = (id: number, action: 'approve' | 'reject') => {
    setPendingTimesheets(timesheets => 
      timesheets.map(timesheet => 
        timesheet.id === id 
          ? { ...timesheet, status: action === 'approve' ? 'approved' : 'rejected' }
          : timesheet
      )
    );
  };

  const pendingCount = pendingTimesheets.filter(t => t.status === 'pending').length;
  const totalHours = pendingTimesheets.reduce((sum, t) => sum + t.totalHours, 0);
  const totalOvertime = pendingTimesheets.reduce((sum, t) => sum + t.overtimeHours, 0);

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
              {pendingTimesheets.map((timesheet) => (
                <TableRow key={timesheet.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {timesheet.employeeAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{timesheet.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{timesheet.department}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{timesheet.week}</TableCell>
                  <TableCell>{timesheet.totalHours - timesheet.overtimeHours}h</TableCell>
                  <TableCell>
                    {timesheet.overtimeHours > 0 ? (
                      <span className="text-amber-600 font-medium">{timesheet.overtimeHours}h</span>
                    ) : (
                      "0h"
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{timesheet.totalHours}h</TableCell>
                  <TableCell>{new Date(timesheet.submittedDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {timesheet.status === "pending" && (
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {timesheet.status === "approved" && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {timesheet.status === "rejected" && (
                      <Badge variant="destructive">
                        <X className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {timesheet.status === "pending" ? (
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
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {timesheet.status === "approved" ? "Approved" : "Rejected"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pendingTimesheets.filter(t => t.status !== 'pending').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>Recently processed timesheets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTimesheets.filter(t => t.status !== 'pending').map((timesheet) => (
                <div key={`processed-${timesheet.id}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {timesheet.employeeAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{timesheet.employeeName}'s timesheet</p>
                      <p className="text-sm text-muted-foreground">{timesheet.week} - {timesheet.totalHours}h total</p>
                    </div>
                  </div>
                  {timesheet.status === "approved" ? (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <X className="w-3 h-3 mr-1" />
                      Rejected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}