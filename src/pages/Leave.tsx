import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { isHrOrAbove, isAdmin, getRoleLabel } from "@/lib/roles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import LeaveRequestForm from "@/components/leave/LeaveRequestForm";
import MyLeaveRequests from "@/components/leave/MyLeaveRequests";
import HRLeaveReview from "@/components/leave/HRLeaveReview";
import AdminFinalApproval from "@/components/leave/AdminFinalApproval";

export default function Leave() {
  const [activeTab, setActiveTab] = useState("request");
  const { userRole, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const showHr = isHrOrAbove(userRole || undefined);
  const showAdmin = isAdmin(userRole || undefined);
  const tabCount = 2 + (showHr ? 1 : 0) + (showAdmin ? 1 : 0);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="border-b bg-card">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-primary">Leave Management</h1>
              <p className="text-muted-foreground">Comprehensive leave request and approval system</p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Role: {getRoleLabel(userRole || "employee")}
            </Badge>
          </div>

          <TabsList
            className="grid w-full max-w-4xl mx-auto mb-6"
            style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
          >
            <TabsTrigger value="request">New Request</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            {showHr && <TabsTrigger value="hr-review">Supervisor Review</TabsTrigger>}
            {showAdmin && <TabsTrigger value="final-approval">Final Approval</TabsTrigger>}
          </TabsList>
        </div>
      </div>

      <TabsContent value="request" className="mt-0">
        <LeaveRequestForm />
      </TabsContent>

      <TabsContent value="my-requests" className="mt-0">
        <MyLeaveRequests />
      </TabsContent>

      {showHr && (
        <TabsContent value="hr-review" className="mt-0">
          <HRLeaveReview />
        </TabsContent>
      )}

      {showAdmin && (
        <TabsContent value="final-approval" className="mt-0">
          <AdminFinalApproval />
        </TabsContent>
      )}
    </Tabs>
  );
}
