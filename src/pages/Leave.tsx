import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import LeaveRequestForm from "@/components/leave/LeaveRequestForm";
import MyLeaveRequests from "@/components/leave/MyLeaveRequests";
import HRLeaveReview from "@/components/leave/HRLeaveReview";
import AdminFinalApproval from "@/components/leave/AdminFinalApproval";

export default function Leave() {
  const [activeTab, setActiveTab] = useState("request");
  
  // Mock user role - in real app this would come from auth context
  const [userRole, setUserRole] = useState<"employee" | "hr" | "admin">("admin");

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b bg-card">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-3xl font-heading font-bold text-primary">Leave Management</h1>
                <p className="text-muted-foreground">Comprehensive leave request and approval system</p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            </div>
            
            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 mb-6">
              <TabsTrigger value="request">New Request</TabsTrigger>
              <TabsTrigger value="my-requests">My Requests</TabsTrigger>
              {(userRole === "hr" || userRole === "admin") && (
                <TabsTrigger value="hr-review">HR Review</TabsTrigger>
              )}
              {userRole === "admin" && (
                <TabsTrigger value="final-approval">Final Approval</TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        <TabsContent value="request" className="mt-0">
          <LeaveRequestForm />
        </TabsContent>

        <TabsContent value="my-requests" className="mt-0">
          <MyLeaveRequests />
        </TabsContent>

        {(userRole === "hr" || userRole === "admin") && (
          <TabsContent value="hr-review" className="mt-0">
            <HRLeaveReview />
          </TabsContent>
        )}

        {userRole === "admin" && (
          <TabsContent value="final-approval" className="mt-0">
            <AdminFinalApproval />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}