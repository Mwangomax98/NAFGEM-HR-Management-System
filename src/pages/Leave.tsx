import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

export default function Leave() {
  const [leaveRequests] = useState([
    {
      id: 1,
      type: "Vacation",
      startDate: "2024-12-20",
      endDate: "2024-12-27",
      days: 6,
      status: "approved",
      reason: "Christmas holiday with family",
      approvedBy: "John Smith",
      submittedDate: "2024-11-01"
    },
    {
      id: 2,
      type: "Sick Leave",
      startDate: "2024-11-15",
      endDate: "2024-11-16",
      days: 2,
      status: "approved",
      reason: "Medical appointment and recovery",
      approvedBy: "John Smith",
      submittedDate: "2024-11-14"
    },
    {
      id: 3,
      type: "Personal",
      startDate: "2024-12-02",
      endDate: "2024-12-02",
      days: 1,
      status: "pending",
      reason: "Family emergency",
      approvedBy: null,
      submittedDate: "2024-11-20"
    },
  ]);

  const [leaveBalance] = useState({
    vacation: { used: 12, total: 25 },
    sick: { used: 3, total: 10 },
    personal: { used: 2, total: 5 }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

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
          <h1 className="text-3xl font-heading font-bold text-primary">Leave Requests</h1>
          <p className="text-muted-foreground">Manage your time off and leave balance</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacation Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveBalance.vacation.total - leaveBalance.vacation.used}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance.vacation.used} used of {leaveBalance.vacation.total} total
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(leaveBalance.vacation.used / leaveBalance.vacation.total) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sick Days</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveBalance.sick.total - leaveBalance.sick.used}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance.sick.used} used of {leaveBalance.sick.total} total
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: `${(leaveBalance.sick.used / leaveBalance.sick.total) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Personal Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaveBalance.personal.total - leaveBalance.personal.used}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaveBalance.personal.used} used of {leaveBalance.personal.total} total
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${(leaveBalance.personal.used / leaveBalance.personal.total) * 100}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Request History</CardTitle>
          <CardDescription>Your submitted leave requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(request.type)}`}></div>
                      <span className="font-medium">{request.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(request.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(request.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>{request.days} day{request.days > 1 ? 's' : ''}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell>{request.approvedBy || "-"}</TableCell>
                  <TableCell className="text-right">
                    {new Date(request.submittedDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}