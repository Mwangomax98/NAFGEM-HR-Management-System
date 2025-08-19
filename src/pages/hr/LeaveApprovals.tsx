import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Check, X, Eye, Clock } from "lucide-react";
import { useState } from "react";

export default function LeaveApprovals() {
  const [pendingLeaves, setPendingLeaves] = useState([]);

  const handleApproval = (id: number, action: 'approve' | 'reject') => {
    setPendingLeaves(leaves => 
      leaves.map(leave => 
        leave.id === id 
          ? { ...leave, status: action === 'approve' ? 'approved' : 'rejected' }
          : leave
      )
    );
  };

  const pendingCount = pendingLeaves.filter(l => l.status === 'pending').length;
  const totalDays = pendingLeaves.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.days, 0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Vacation":
        return "bg-blue-500";
      case "Sick Leave":
        return "bg-red-500";
      case "Personal":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Leave Approvals</h1>
          <p className="text-muted-foreground">Review and approve employee leave requests</p>
        </div>
        <Badge variant="destructive" className="text-lg px-3 py-1">
          {pendingCount} Pending
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
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
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDays}</div>
            <p className="text-xs text-muted-foreground">
              Days requested
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              New requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>Review and approve or reject employee leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Remaining Balance</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No leave requests to review yet.
                  </TableCell>
                </TableRow>
              ) : (
                pendingLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {leave.employeeAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{leave.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{leave.department}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getTypeColor(leave.leaveType)}`}></div>
                        <span className="font-medium">{leave.leaveType}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{leave.days} day{leave.days > 1 ? 's' : ''}</TableCell>
                    <TableCell>
                      <span className={leave.remainingBalance < leave.days ? "text-red-600" : "text-green-600"}>
                        {leave.remainingBalance} days
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={leave.reason}>
                        {leave.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {leave.status === "pending" && (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {leave.status === "approved" && (
                        <Badge variant="default" className="bg-green-500">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      {leave.status === "rejected" && (
                        <Badge variant="destructive">
                          <X className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {leave.status === "pending" ? (
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
                            onClick={() => handleApproval(leave.id, 'approve')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleApproval(leave.id, 'reject')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {leave.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Leave Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Leave Balances</CardTitle>
          <CardDescription>Current leave balances across the organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Vacation Days</h4>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">0</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Days remaining across all employees</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <h4 className="font-medium text-red-900 dark:text-red-100">Sick Days</h4>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">0</p>
              <p className="text-sm text-red-600 dark:text-red-400">Days remaining across all employees</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100">Personal Days</h4>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">0</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Days remaining across all employees</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}