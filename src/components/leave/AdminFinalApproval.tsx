import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, MessageSquare, Calendar, Crown, FileText, User, TrendingUp, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const mockHRApprovedRequests = [
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
    daysGranted: 6,
    reason: "Christmas holiday with family",
    handoverDetails: "All tasks delegated to Mary Johnson. Client meetings rescheduled to January.",
    replacementPerson: "Mary Johnson",
    submittedDate: "2024-11-15",
    hrApprovedDate: "2024-11-16",
    project: "USAID Health Systems",
    hrComments: [
      { user: "HR Manager", date: "2024-11-16", message: "Approved. Good handover plan provided.", daysGranted: 6 }
    ],
    priority: "normal",
    impact: "low",
    status: undefined,
    adminComments: [],
    finalDecisionDate: undefined
  },
  {
    id: 2,
    refNumber: "LV-2024-C9M4N2",
    employeeName: "Amanda Williams",
    employeeId: "EMP003",
    department: "Human Resources",
    leaveType: "Maternity Leave",
    fromDate: "2025-01-15",
    toDate: "2025-04-15",
    daysRequested: 90,
    daysGranted: 90,
    reason: "Maternity leave for childbirth",
    handoverDetails: "Full transition plan prepared. Temporary HR coordinator hired. All recruitment processes handed over.",
    replacementPerson: "Temporary HR Coordinator",
    submittedDate: "2024-11-10",
    hrApprovedDate: "2024-11-12",
    project: "HR Operations",
    hrComments: [
      { user: "HR Manager", date: "2024-11-12", message: "Approved. Temporary replacement confirmed.", daysGranted: 90 }
    ],
    priority: "high",
    impact: "high",
    status: undefined,
    adminComments: [],
    finalDecisionDate: undefined
  },
  {
    id: 3,
    refNumber: "LV-2024-D5K8L3",
    employeeName: "Michael Chen",
    employeeId: "EMP002",
    department: "Finance",
    leaveType: "Sick Leave",
    fromDate: "2024-11-25",
    toDate: "2024-11-27",
    daysRequested: 3,
    daysGranted: 3,
    reason: "Medical procedure - surgical follow-up",
    handoverDetails: "Emergency financial approvals delegated to Deputy CFO.",
    replacementPerson: "Deputy CFO",
    submittedDate: "2024-11-20",
    hrApprovedDate: "2024-11-21",
    project: "General Administration",
    hrComments: [
      { user: "HR Manager", date: "2024-11-21", message: "Medical documentation provided. Approved.", daysGranted: 3 }
    ],
    priority: "urgent",
    impact: "medium",
    status: undefined,
    adminComments: [],
    finalDecisionDate: undefined
  }
];

const impactColors = {
  low: { bg: "bg-green-100", text: "text-green-800", label: "Low Impact" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Medium Impact" },
  high: { bg: "bg-red-100", text: "text-red-800", label: "High Impact" }
};

const mockAnalytics = {
  thisMonth: {
    submitted: 24,
    approved: 18,
    rejected: 3,
    pending: 3
  },
  byDepartment: [
    { department: "Program Management", requests: 8, approved: 6 },
    { department: "Finance", requests: 6, approved: 5 },
    { department: "HR", requests: 4, approved: 3 },
    { department: "Operations", requests: 6, approved: 4 }
  ],
  byLeaveType: [
    { type: "Annual Leave", count: 12, avgDays: 5.2 },
    { type: "Sick Leave", count: 6, avgDays: 2.1 },
    { type: "Maternity/Paternity", count: 3, avgDays: 45 },
    { type: "Personal", count: 3, avgDays: 1 }
  ]
};

export default function AdminFinalApproval() {
  const [requests, setRequests] = useState(mockHRApprovedRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComments, setAdminComments] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();

  const handleFinalDecision = (requestId: number, decision: 'approve' | 'reject') => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    if (decision === 'reject' && !adminComments.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for final rejection.",
        variant: "destructive"
      });
      return;
    }

    // Add digital signature simulation
    const signature = {
      user: "Executive Director",
      userId: "ADMIN001",
      timestamp: new Date().toISOString(),
      action: decision
    };

    // Update request status
    setRequests(prev => prev.map(r => 
      r.id === requestId 
        ? { 
            ...r, 
            status: decision === 'approve' ? 'final_approved' : 'rejected_final',
            adminComments: [
              ...(r.adminComments || []),
              { 
                user: signature.user, 
                date: signature.timestamp, 
                message: adminComments || `Request ${decision}ed by Executive Director.`
              }
            ],
            finalSignature: signature,
            finalDecisionDate: new Date().toISOString()
          }
        : r
    ));

    toast({
      title: `Final ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
      description: `Leave request ${request.refNumber} has been ${decision === 'approve' ? 'finally approved' : 'rejected'}. ${decision === 'approve' ? 'Employee and calendar will be notified.' : 'Request returned to employee.'}`,
    });

    setAdminComments("");
    setSelectedRequest(null);
  };

  const getImpactBadge = (impact: string) => {
    const config = impactColors[impact as keyof typeof impactColors];
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const pendingFinalRequests = requests.filter(r => !r.status || r.status === 'hr_approved');
  const finalizedRequests = requests.filter(r => r.status && (r.status === 'final_approved' || r.status === 'rejected_final'));

  const approvalRate = mockAnalytics.thisMonth.submitted > 0 
    ? Math.round((mockAnalytics.thisMonth.approved / mockAnalytics.thisMonth.submitted) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary flex items-center">
            <Crown className="w-8 h-8 mr-3 text-accent" />
            Executive Final Approval
          </h1>
          <p className="text-muted-foreground">Review HR-approved requests for final authorization</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingFinalRequests.length} Awaiting Final Approval
          </Badge>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Final</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingFinalRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your decision</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.thisMonth.submitted}</div>
            <p className="text-xs text-muted-foreground">Total requests submitted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvalRate}%</div>
            <p className="text-xs text-muted-foreground">Final approval rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pendingFinalRequests.filter(r => r.impact === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical decisions needed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Final Approval ({pendingFinalRequests.length})</TabsTrigger>
          <TabsTrigger value="finalized">Finalized ({finalizedRequests.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>HR-Approved Requests Awaiting Final Decision</CardTitle>
              <CardDescription>These requests have been approved by HR and require your final authorization</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Details</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>HR Decision</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingFinalRequests.map((request) => (
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
                          <div className="font-medium">{request.daysGranted} days granted</div>
                          <div className="text-muted-foreground">
                            {format(new Date(request.fromDate), "MMM dd")} - {format(new Date(request.toDate), "MMM dd")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getImpactBadge(request.impact)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Badge variant="default" className="bg-green-100 text-green-800 border-0 mb-1">
                            HR Approved
                          </Badge>
                          <div className="text-muted-foreground">
                            {format(new Date(request.hrApprovedDate), "MMM dd")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center">
                                <Crown className="w-5 h-5 mr-2 text-accent" />
                                Executive Final Decision - {request.refNumber}
                              </DialogTitle>
                              <DialogDescription>
                                Make the final decision on {request.employeeName}'s HR-approved leave request
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRequest && (
                              <div className="space-y-6">
                                {/* Request Summary */}
                                <Alert className="border-accent">
                                  <Crown className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>Executive Summary:</strong> {selectedRequest.leaveType} request for {selectedRequest.daysGranted} days from {selectedRequest.employeeName} ({selectedRequest.department}). 
                                    HR has approved this request and recommends final approval.
                                  </AlertDescription>
                                </Alert>

                                {/* Employee & Leave Information Grid */}
                                <div className="grid grid-cols-3 gap-6">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg flex items-center">
                                        <User className="w-4 h-4 mr-2" />
                                        Employee Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div><strong>Name:</strong> {selectedRequest.employeeName}</div>
                                      <div><strong>ID:</strong> {selectedRequest.employeeId}</div>
                                      <div><strong>Department:</strong> {selectedRequest.department}</div>
                                      <div><strong>Project:</strong> {selectedRequest.project}</div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Leave Information
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div><strong>Type:</strong> {selectedRequest.leaveType}</div>
                                      <div><strong>Requested:</strong> {selectedRequest.daysRequested} days</div>
                                      <div><strong>HR Granted:</strong> {selectedRequest.daysGranted} days</div>
                                      <div><strong>Period:</strong> {format(new Date(selectedRequest.fromDate), "MMM dd")} - {format(new Date(selectedRequest.toDate), "MMM dd")}</div>
                                    </CardContent>
                                  </Card>

                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">Impact Assessment</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <div>{getImpactBadge(selectedRequest.impact)}</div>
                                      <div><strong>Replacement:</strong> {selectedRequest.replacementPerson}</div>
                                      <div><strong>Submitted:</strong> {format(new Date(selectedRequest.submittedDate), "MMM dd")}</div>
                                      <div><strong>HR Approved:</strong> {format(new Date(selectedRequest.hrApprovedDate), "MMM dd")}</div>
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Detailed Information */}
                                <div className="grid grid-cols-1 gap-6">
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        Request Details
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div>
                                        <label className="font-medium">Reason for Leave:</label>
                                        <p className="text-muted-foreground mt-1">{selectedRequest.reason}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Handover Arrangements:</label>
                                        <p className="text-muted-foreground mt-1">{selectedRequest.handoverDetails}</p>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* HR Comments */}
                                  <Card>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        HR Review & Recommendation
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {selectedRequest.hrComments.map((comment, index) => (
                                        <div key={index} className="bg-green-50 p-4 rounded-lg">
                                          <div className="flex justify-between items-start mb-2">
                                            <strong className="text-green-800">{comment.user}</strong>
                                            <span className="text-sm text-green-600">{format(new Date(comment.date), "PPP")}</span>
                                          </div>
                                          <p className="text-green-700">{comment.message}</p>
                                          {comment.daysGranted && (
                                            <p className="text-sm text-green-600 mt-2">
                                              <strong>Days Granted by HR:</strong> {comment.daysGranted}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </CardContent>
                                  </Card>
                                </div>

                                {/* Executive Decision Section */}
                                <Card className="border-accent border-2">
                                  <CardHeader className="bg-gradient-primary text-primary-foreground">
                                    <CardTitle className="text-xl flex items-center">
                                      <Crown className="w-5 h-5 mr-2" />
                                      Executive Final Decision
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-6 space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Executive Comments/Recommendation</label>
                                      <Textarea
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                        placeholder="Add your executive decision rationale, any conditions, or reasons if not approving..."
                                        rows={4}
                                      />
                                    </div>

                                    <div className="flex justify-end space-x-4">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => handleFinalDecision(selectedRequest.id, 'reject')}
                                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Do Not Approve
                                      </Button>
                                      <Button 
                                        onClick={() => handleFinalDecision(selectedRequest.id, 'approve')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                        size="lg"
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Grant Final Approval
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finalized">
          <Card>
            <CardHeader>
              <CardTitle>Finalized Decisions</CardTitle>
              <CardDescription>Completed executive decisions on leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Final Decision</TableHead>
                    <TableHead>Decision Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalizedRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No finalized decisions yet
                      </TableCell>
                    </TableRow>
                  )}
                  {finalizedRequests.map((request) => (
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
                          <div className="font-medium">{request.daysGranted} days</div>
                          <div className="text-muted-foreground">
                            {format(new Date(request.fromDate), "MMM dd")} - {format(new Date(request.toDate), "MMM dd")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.status === 'final_approved' ? 'default' : 'destructive'} className="bg-green-600">
                          {request.status === 'final_approved' ? 'Finally Approved' : 'Not Approved'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.finalDecisionDate && format(new Date(request.finalDecisionDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'final_approved' ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-0">
                            Active/Scheduled
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

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
                <CardDescription>Leave request statistics for this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Submitted:</span>
                    <span className="font-bold text-2xl">{mockAnalytics.thisMonth.submitted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Finally Approved:</span>
                    <span className="font-bold text-2xl text-green-600">{mockAnalytics.thisMonth.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rejected:</span>
                    <span className="font-bold text-2xl text-red-600">{mockAnalytics.thisMonth.rejected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending:</span>
                    <span className="font-bold text-2xl text-orange-600">{mockAnalytics.thisMonth.pending}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between items-center">
                    <span>Approval Rate:</span>
                    <span className="font-bold text-2xl text-accent">{approvalRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Breakdown</CardTitle>
                <CardDescription>Leave requests by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnalytics.byDepartment.map((dept, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{dept.department}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{dept.approved}/{dept.requests}</span>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-accent h-2 rounded-full" 
                            style={{ width: `${(dept.approved / dept.requests) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Leave Type Analysis</CardTitle>
                <CardDescription>Breakdown by leave type and average duration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {mockAnalytics.byLeaveType.map((type, index) => (
                    <div key={index} className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium">{type.type}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">Requests: {type.count}</span>
                        <span className="text-sm text-muted-foreground">Avg: {type.avgDays} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}