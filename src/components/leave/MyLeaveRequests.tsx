import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Search, Filter, Edit2, Trash2, MessageSquare, Calendar, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";

const mockRequests = [
  {
    id: 1,
    refNumber: "LV-2024-A8F2G1",
    leaveType: "Annual Leave",
    fromDate: "2024-12-20",
    toDate: "2024-12-27",
    days: 6,
    project: "USAID Health Systems",
    status: "pending",
    submittedDate: "2024-11-15",
    reason: "Christmas holiday with family",
    handoverDetails: "All tasks have been delegated to Mary Johnson. Client meetings rescheduled to January.",
    replacementPerson: "Mary Johnson",
    hrComments: [],
    adminComments: []
  },
  {
    id: 2,
    refNumber: "LV-2024-B3H7K9",
    leaveType: "Sick Leave",
    fromDate: "2024-11-15",
    toDate: "2024-11-16",
    days: 2,
    project: "EU Education Reform",
    status: "hr_approved",
    submittedDate: "2024-11-14",
    reason: "Medical appointment and recovery",
    handoverDetails: "Emergency tasks covered by team lead. Non-urgent items postponed.",
    replacementPerson: "Team Lead",
    hrComments: [
      { user: "HR Manager", date: "2024-11-14", message: "Medical certificate received. Approved for HR review." }
    ],
    adminComments: []
  },
  {
    id: 3,
    refNumber: "LV-2024-C9M4N2",
    leaveType: "Personal Day",
    fromDate: "2024-10-05",
    toDate: "2024-10-05",
    days: 1,
    project: "DFID Governance",
    status: "final_approved",
    submittedDate: "2024-09-28",
    reason: "Family emergency",
    handoverDetails: "Day coverage arranged with colleague.",
    replacementPerson: "John Smith",
    hrComments: [
      { user: "HR Manager", date: "2024-09-29", message: "Approved for urgent personal matters." }
    ],
    adminComments: [
      { user: "Executive Director", date: "2024-09-30", message: "Final approval granted. Hope everything is resolved." }
    ]
  },
  {
    id: 4,
    refNumber: "LV-2024-D2P8Q5",
    leaveType: "Annual Leave",
    fromDate: "2024-08-15",
    toDate: "2024-08-25",
    days: 8,
    project: "World Bank Infrastructure",
    status: "rejected",
    submittedDate: "2024-07-20",
    reason: "Summer vacation",
    handoverDetails: "Project deadlines conflict with requested dates.",
    replacementPerson: "Sarah Wilson",
    hrComments: [
      { user: "HR Manager", date: "2024-07-22", message: "Conflicts with critical project milestones. Please reschedule." }
    ],
    adminComments: []
  }
];

const statusColors = {
  draft: { bg: "bg-gray-100", text: "text-gray-800", label: "Draft" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending HR Review" },
  hr_approved: { bg: "bg-blue-100", text: "text-blue-800", label: "HR Approved" },
  final_approved: { bg: "bg-green-100", text: "text-green-800", label: "Final Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" }
};

export default function MyLeaveRequests() {
  const [requests, setRequests] = useState(mockRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteRequest = (id: number) => {
    setRequests(requests.filter(req => req.id !== id));
  };

  const getStatusBadge = (status: string) => {
    const config = statusColors[status as keyof typeof statusColors];
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const canEdit = (status: string) => {
    return status === "draft" || status === "rejected";
  };

  const canDelete = (status: string) => {
    return status === "draft";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">My Leave Requests</h1>
          <p className="text-muted-foreground">Track and manage your leave request history</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {filteredRequests.length} Request{filteredRequests.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by reference number, leave type, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="hr_approved">HR Approved</SelectItem>
                  <SelectItem value="final_approved">Final Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Request History</CardTitle>
          <CardDescription>Your submitted leave requests and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.refNumber}</TableCell>
                  <TableCell>{request.leaveType}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(request.fromDate), "MMM dd")}</div>
                      <div className="text-muted-foreground">to {format(new Date(request.toDate), "MMM dd")}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{request.days} day{request.days > 1 ? 's' : ''}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.project}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{format(new Date(request.submittedDate), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(request)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Leave Request Details</DialogTitle>
                            <DialogDescription>
                              Reference: {request.refNumber}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Leave Period
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(selectedRequest.fromDate), "PPP")} to {format(new Date(selectedRequest.toDate), "PPP")}
                                  </p>
                                  <p className="text-sm font-medium">{selectedRequest.days} days</p>
                                </div>
                                <div>
                                  <h4 className="font-medium flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Status
                                  </h4>
                                  {getStatusBadge(selectedRequest.status)}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium flex items-center mb-2">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Reason
                                </h4>
                                <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
                              </div>

                              <div>
                                <h4 className="font-medium flex items-center mb-2">
                                  <User className="w-4 h-4 mr-2" />
                                  Handover Details
                                </h4>
                                <p className="text-sm text-muted-foreground">{selectedRequest.handoverDetails}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  <strong>Replacement:</strong> {selectedRequest.replacementPerson}
                                </p>
                              </div>

                              {(selectedRequest.hrComments.length > 0 || selectedRequest.adminComments.length > 0) && (
                                <div>
                                  <h4 className="font-medium flex items-center mb-2">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Comments
                                  </h4>
                                  <div className="space-y-3">
                                    {selectedRequest.hrComments.map((comment, index) => (
                                      <div key={index} className="bg-blue-50 p-3 rounded">
                                        <div className="flex justify-between items-start">
                                          <strong className="text-sm">{comment.user}</strong>
                                          <span className="text-xs text-muted-foreground">{format(new Date(comment.date), "PPP")}</span>
                                        </div>
                                        <p className="text-sm mt-1">{comment.message}</p>
                                      </div>
                                    ))}
                                    {selectedRequest.adminComments.map((comment, index) => (
                                      <div key={index} className="bg-green-50 p-3 rounded">
                                        <div className="flex justify-between items-start">
                                          <strong className="text-sm">{comment.user}</strong>
                                          <span className="text-xs text-muted-foreground">{format(new Date(comment.date), "PPP")}</span>
                                        </div>
                                        <p className="text-sm mt-1">{comment.message}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {canEdit(request.status) && (
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {canDelete(request.status) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Leave Request</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete request {request.refNumber}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRequest(request.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
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