import { useState, useEffect } from "react";
import { supabase } from "@/lib/api";
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

const impactColors = {
  low: { bg: "bg-green-100", text: "text-green-800", label: "Low Impact" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Medium Impact" },
  high: { bg: "bg-red-100", text: "text-red-800", label: "High Impact" }
};

export default function AdminFinalApproval() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComments, setAdminComments] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [analytics, setAnalytics] = useState({
    thisMonth: { submitted: 0, approved: 0, rejected: 0, pending: 0 }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
    fetchAnalytics();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .in('status', ['hr_approved', 'final_approved', 'rejected_final'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = data?.map(request => ({
        id: request.id,
        refNumber: request.ref_number,
        employeeName: request.employee_name,
        employeeId: request.requester_id,
        department: 'N/A',
        leaveType: request.leave_type,
        fromDate: request.from_date,
        toDate: request.to_date,
        daysRequested: request.number_of_days,
        daysGranted: request.days_granted,
        reason: request.reason || '',
        handoverDetails: request.handover_details,
        replacementPerson: request.replacement_person,
        submittedDate: request.created_at,
        hrApprovedDate: request.hr_approved_date,
        project: 'N/A',
        hrComments: request.hr_comments || [],
        priority: request.priority,
        impact: request.impact,
        status: request.status,
        adminComments: request.admin_comments || [],
        finalDecisionDate: request.final_decision_date
      })) || [];

      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .gte('created_at', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      if (error) throw error;

      const submitted = data?.length || 0;
      const approved = data?.filter(r => r.status === 'final_approved').length || 0;
      const rejected = data?.filter(r => r.status === 'rejected_final').length || 0;
      const pending = data?.filter(r => r.status === 'hr_approved').length || 0;

      setAnalytics({
        thisMonth: { submitted, approved, rejected, pending }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleFinalDecision = async (requestId: string, decision: 'approve' | 'reject') => {
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

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const signature = {
        user: "Executive Director",
        userId: user?.id || "ADMIN001",
        timestamp: new Date().toISOString(),
        action: decision
      };

      const newComment = {
        user: signature.user,
        date: signature.timestamp,
        message: adminComments || `Request ${decision}ed by Executive Director.`
      };

      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: decision === 'approve' ? 'final_approved' : 'rejected_final',
          admin_comments: [...(request.adminComments || []), newComment],
          final_signature: signature,
          final_decision_date: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Final ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
        description: `Leave request ${request.refNumber} has been ${decision === 'approve' ? 'finally approved' : 'rejected'}. ${decision === 'approve' ? 'Employee and calendar will be notified.' : 'Request returned to employee.'}`,
      });

      setAdminComments("");
      setSelectedRequest(null);
      
      // Refresh requests
      fetchLeaveRequests();
      fetchAnalytics();
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast({
        title: "Error",
        description: "Failed to update leave request.",
        variant: "destructive"
      });
    }
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

  const pendingFinalRequests = requests.filter(r => r.status === 'hr_approved');
  const finalizedRequests = requests.filter(r => r.status === 'final_approved' || r.status === 'rejected_final');

  const approvalRate = analytics.thisMonth.submitted > 0 
    ? Math.round((analytics.thisMonth.approved / analytics.thisMonth.submitted) * 100)
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
            <div className="text-2xl font-bold">{analytics.thisMonth.submitted}</div>
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
                                <Alert className="border-accent">
                                  <Crown className="h-4 w-4" />
                                  <AlertDescription>
                                    <strong>Executive Summary:</strong> {selectedRequest.leaveType} request for {selectedRequest.daysGranted} days from {selectedRequest.employeeName} ({selectedRequest.department}). 
                                    HR has approved this request and recommends final approval.
                                  </AlertDescription>
                                </Alert>

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
                                      <div><strong>Impact Level:</strong> {getImpactBadge(selectedRequest.impact)}</div>
                                      <div><strong>Priority:</strong> {selectedRequest.priority}</div>
                                      <div><strong>Replacement:</strong> {selectedRequest.replacementPerson}</div>
                                    </CardContent>
                                  </Card>
                                </div>

                                <Card>
                                  <CardHeader>
                                    <CardTitle>HR Comments & Recommendation</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    {selectedRequest.hrComments.map((comment: any, index: number) => (
                                      <div key={index} className="mb-4 p-4 bg-muted rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                          <strong>{comment.user}</strong>
                                          <span className="text-sm text-muted-foreground">
                                            {format(new Date(comment.date), "PPP")}
                                          </span>
                                        </div>
                                        <p>{comment.message}</p>
                                        {comment.daysGranted && (
                                          <div className="mt-2 text-sm">
                                            <strong>Days Granted:</strong> {comment.daysGranted}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>

                                <Card>
                                  <CardHeader>
                                    <CardTitle>Executive Decision</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium">Admin Comments</label>
                                      <Textarea
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                        placeholder="Provide your executive decision rationale..."
                                        rows={4}
                                      />
                                    </div>
                                    <div className="flex space-x-4">
                                      <Button
                                        onClick={() => handleFinalDecision(selectedRequest.id, 'approve')}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Final Approval
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleFinalDecision(selectedRequest.id, 'reject')}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Final Rejection
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
              {pendingFinalRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="w-12 h-12 mx-auto mb-4" />
                  <p>No requests awaiting final approval</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finalized">
          <Card>
            <CardHeader>
              <CardTitle>Finalized Leave Requests</CardTitle>
              <CardDescription>Requests that have received final executive decision</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Details</TableHead>
                    <TableHead>Final Decision</TableHead>
                    <TableHead>Decision Date</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.leaveType}</p>
                          <p className="text-sm text-muted-foreground">{request.daysGranted} days</p>
                          <p className="text-xs text-muted-foreground">{request.refNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            request.status === 'final_approved'
                              ? 'bg-green-100 text-green-800 border-0'
                              : 'bg-red-100 text-red-800 border-0'
                          }
                        >
                          {request.status === 'final_approved' ? 'Finally Approved' : 'Finally Rejected'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.finalDecisionDate && format(new Date(request.finalDecisionDate), "PPP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {finalizedRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4" />
                  <p>No finalized requests yet</p>
                </div>
              )}
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
                    <span className="font-bold text-2xl">{analytics.thisMonth.submitted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Finally Approved:</span>
                    <span className="font-bold text-2xl text-green-600">{analytics.thisMonth.approved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Rejected:</span>
                    <span className="font-bold text-2xl text-red-600">{analytics.thisMonth.rejected}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending:</span>
                    <span className="font-bold text-2xl text-orange-600">{analytics.thisMonth.pending}</span>
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
                <CardTitle>Analytics Coming Soon</CardTitle>
                <CardDescription>Detailed analytics will be available once more data is collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p>Department and leave type breakdowns will appear here as data is accumulated.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}