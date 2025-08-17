import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, MessageSquare, Calendar, Clock, User, FileText, AlertCircle, Filter } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const mockPendingRequests = [
  {
    id: 1,
    refNumber: "LV-2024-A8F2G1",
    employeeName: "Sarah Johnson",
    employeeId: "EMP001",
    department: "Program Management",
    leaveType: "Annual Leave",
    fromDate: "2024-12-20",
    toDate: "2024-12-27",
    daysRequested: 6,
    reason: "Christmas holiday with family",
    handoverDetails: "All tasks delegated to Mary Johnson. Client meetings rescheduled to January. Project reports completed and filed.",
    replacementPerson: "Mary Johnson",
    submittedDate: "2024-11-15",
    project: "USAID Health Systems",
    currentBalance: { used: 8, total: 25 },
    documents: ["medical_cert.pdf"],
    priority: "normal",
    status: undefined,
    hrComments: []
  },
  {
    id: 2,
    refNumber: "LV-2024-B3H7K9",
    employeeName: "Michael Chen",
    employeeId: "EMP002",
    department: "Finance",
    leaveType: "Sick Leave",
    fromDate: "2024-11-25",
    toDate: "2024-11-27",
    daysRequested: 3,
    reason: "Medical procedure - surgical follow-up",
    handoverDetails: "Emergency financial approvals delegated to Deputy CFO. Monthly reports postponed to December 2nd.",
    replacementPerson: "Deputy CFO",
    submittedDate: "2024-11-20",
    project: "General Administration",
    currentBalance: { used: 2, total: 15 },
    documents: ["medical_cert.pdf", "surgery_schedule.pdf"],
    priority: "urgent",
    status: undefined,
    hrComments: []
  },
  {
    id: 3,
    refNumber: "LV-2024-C9M4N2",
    employeeName: "Amanda Williams",
    employeeId: "EMP003",
    department: "Human Resources",
    leaveType: "Maternity Leave",
    fromDate: "2025-01-15",
    toDate: "2025-04-15",
    daysRequested: 90,
    reason: "Maternity leave for childbirth",
    handoverDetails: "Full transition plan prepared. Temporary HR coordinator hired. All recruitment processes handed over.",
    replacementPerson: "Temporary HR Coordinator",
    submittedDate: "2024-11-10",
    project: "HR Operations",
    currentBalance: { used: 0, total: 90 },
    documents: ["medical_cert.pdf", "expected_delivery_date.pdf"],
    priority: "high",
    status: undefined,
    hrComments: []
  }
];

const statusColors = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending Review" },
  approved: { bg: "bg-green-100", text: "text-green-800", label: "Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" }
};

const priorityColors = {
  urgent: { bg: "bg-red-100", text: "text-red-800", icon: "🚨" },
  high: { bg: "bg-orange-100", text: "text-orange-800", icon: "⚡" },
  normal: { bg: "bg-blue-100", text: "text-blue-800", icon: "📋" }
};

export default function HRLeaveReview() {
  const [requests, setRequests] = useState(mockPendingRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewComments, setReviewComments] = useState("");
  const [daysGranted, setDaysGranted] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  const handleApproval = (requestId: number, action: 'approve' | 'reject') => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    if (action === 'reject' && !reviewComments.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    if (action === 'approve' && (!daysGranted || parseInt(daysGranted) <= 0)) {
      toast({
        title: "Days Required",
        description: "Please specify the number of days granted.",
        variant: "destructive"
      });
      return;
    }

    // Add digital signature simulation
    const signature = {
      user: "HR Manager",
      userId: "HR001",
      timestamp: new Date().toISOString(),
      action: action
    };

    // Update request status
    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: action === 'approve' ? 'hr_approved' : 'rejected',
            hrComments: [
              { 
                user: signature.user, 
                date: signature.timestamp, 
                message: reviewComments || `Request ${action}ed by HR.`,
                daysGranted: action === 'approve' ? parseInt(daysGranted) : undefined
              }
            ],
            digitalSignature: signature
          }
        : r
    ));

    toast({
      title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      description: `Leave request ${request.refNumber} has been ${action}ed and forwarded ${action === 'approve' ? 'to Admin for final approval' : 'back to employee'}.`,
    });

    setReviewComments("");
    setDaysGranted("");
    setSelectedRequest(null);
  };

  const calculateRemainingDays = (request: any, granted?: number) => {
    const grantedDays = granted || request.daysRequested;
    return request.currentBalance.total - request.currentBalance.used - grantedDays;
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityColors[priority as keyof typeof priorityColors];
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} border-0`}>
        {config.icon} {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const pendingRequests = requests.filter(r => !r.status || r.status === 'pending');
  const processedRequests = requests.filter(r => r.status && r.status !== 'pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">HR Leave Review</h1>
          <p className="text-muted-foreground">Review and approve employee leave requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingRequests.length} Pending
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting HR decision</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingRequests.reduce((sum, r) => sum + r.daysRequested, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Days requested</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Requests</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingRequests.filter(r => r.priority === 'urgent').length}
            </div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Requests processed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="processed">Processed ({processedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
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
                    <TableHead>Leave Details</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(request.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{request.department}</p>
                            <p className="text-xs text-muted-foreground">{request.employeeId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.leaveType}</p>
                          <p className="text-sm text-muted-foreground">{request.project}</p>
                          <p className="text-xs text-muted-foreground">{request.refNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{request.daysRequested} days</div>
                          <div className="text-muted-foreground">
                            {format(new Date(request.fromDate), "MMM dd")} - {format(new Date(request.toDate), "MMM dd")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={`font-medium ${calculateRemainingDays(request) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {calculateRemainingDays(request)} remaining
                          </div>
                          <div className="text-muted-foreground">
                            {request.currentBalance.used}/{request.currentBalance.total} used
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(request.priority)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.submittedDate), "MMM dd")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Leave Request Review - {request.refNumber}</DialogTitle>
                                <DialogDescription>
                                  Review and make decision on {request.employeeName}'s leave request
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-6">
                                  {/* Employee Information */}
                                  <div className="grid grid-cols-2 gap-6">
                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Employee Information</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <User className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">{selectedRequest.employeeName}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">ID: {selectedRequest.employeeId}</p>
                                        <p className="text-sm text-muted-foreground">Department: {selectedRequest.department}</p>
                                        <p className="text-sm text-muted-foreground">Project: {selectedRequest.project}</p>
                                      </CardContent>
                                    </Card>

                                    <Card>
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Leave Balance</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-2">
                                        <div className="flex justify-between">
                                          <span>Total Entitlement:</span>
                                          <span className="font-medium">{selectedRequest.currentBalance.total} days</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Already Used:</span>
                                          <span className="font-medium">{selectedRequest.currentBalance.used} days</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Requested:</span>
                                          <span className="font-medium">{selectedRequest.daysRequested} days</span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between">
                                          <span>Remaining After:</span>
                                          <span className={`font-bold ${calculateRemainingDays(selectedRequest) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                            {calculateRemainingDays(selectedRequest)} days
                                          </span>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Leave Details */}
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg flex items-center">
                                        <Calendar className="w-5 h-5 mr-2" />
                                        Leave Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="font-medium">Leave Type:</label>
                                          <p className="text-muted-foreground">{selectedRequest.leaveType}</p>
                                        </div>
                                        <div>
                                          <label className="font-medium">Duration:</label>
                                          <p className="text-muted-foreground">
                                            {format(new Date(selectedRequest.fromDate), "PPP")} to {format(new Date(selectedRequest.toDate), "PPP")}
                                          </p>
                                        </div>
                                      </div>
                                      <div>
                                        <label className="font-medium">Reason:</label>
                                        <p className="text-muted-foreground">{selectedRequest.reason}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Handover Details:</label>
                                        <p className="text-muted-foreground">{selectedRequest.handoverDetails}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Replacement Person:</label>
                                        <p className="text-muted-foreground">{selectedRequest.replacementPerson}</p>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* Balance Warning */}
                                  {calculateRemainingDays(selectedRequest) < 0 && (
                                    <Alert>
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        Warning: This request exceeds the employee's available leave balance by {Math.abs(calculateRemainingDays(selectedRequest))} days.
                                      </AlertDescription>
                                    </Alert>
                                  )}

                                  {/* HR Review Section */}
                                  <Card className="border-accent">
                                    <CardHeader className="bg-accent text-accent-foreground">
                                      <CardTitle className="text-lg">HR Review & Decision</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-sm font-medium mb-2">Days Granted</label>
                                          <Input
                                            type="number"
                                            min="0"
                                            max={selectedRequest.daysRequested}
                                            value={daysGranted}
                                            onChange={(e) => setDaysGranted(e.target.value)}
                                            placeholder={selectedRequest.daysRequested.toString()}
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Maximum: {selectedRequest.daysRequested} days requested
                                          </p>
                                        </div>
                                        {daysGranted && (
                                          <div className="flex items-end">
                                            <div>
                                              <label className="block text-sm font-medium mb-2">Remaining After Grant</label>
                                              <div className={`text-lg font-bold ${calculateRemainingDays(selectedRequest, parseInt(daysGranted)) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                                                {calculateRemainingDays(selectedRequest, parseInt(daysGranted))} days
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div>
                                        <label className="block text-sm font-medium mb-2">HR Comments</label>
                                        <Textarea
                                          value={reviewComments}
                                          onChange={(e) => setReviewComments(e.target.value)}
                                          placeholder="Add your review comments, conditions, or reasons for rejection..."
                                          rows={3}
                                        />
                                      </div>

                                      <div className="flex justify-end space-x-3">
                                        <Button 
                                          variant="outline" 
                                          onClick={() => handleApproval(selectedRequest.id, 'reject')}
                                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          Reject Request
                                        </Button>
                                        <Button 
                                          onClick={() => handleApproval(selectedRequest.id, 'approve')}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <Check className="w-4 h-4 mr-2" />
                                          Approve Request
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processed">
          <Card>
            <CardHeader>
              <CardTitle>Processed Requests</CardTitle>
              <CardDescription>Previously reviewed leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Processed Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No processed requests yet
                      </TableCell>
                    </TableRow>
                  )}
                  {processedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(request.employeeName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.employeeName}</p>
                            <p className="text-sm text-muted-foreground">{request.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.leaveType}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{request.daysRequested} days</div>
                          <div className="text-muted-foreground">
                            {format(new Date(request.fromDate), "MMM dd")} - {format(new Date(request.toDate), "MMM dd")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'hr_approved' ? 'default' : 'destructive'}>
                          {request.status === 'hr_approved' ? 'Approved' : 'Rejected'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.hrComments?.[0] && format(new Date(request.hrComments[0].date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'hr_approved' ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-0">
                            Awaiting Final Approval
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-0">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}