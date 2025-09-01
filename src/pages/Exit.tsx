import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, FileText, User, Calendar, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExitRequestModal } from "@/components/modals/ExitRequestModal";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ExitRequest {
  id: string;
  resignation_reason: string;
  resignation_date: string;
  proposed_last_working_day: string;
  final_last_working_day?: string;
  status: string;
  detailed_reason?: string;
  handover_notes?: string;
  hr_comments?: string;
  admin_comments?: string;
  created_at: string;
}

interface ChecklistItem {
  id: string;
  task_title: string;
  task_description: string;
  completed: boolean;
  completed_at?: string;
  notes?: string;
  order_index: number;
}

interface Asset {
  id: string;
  asset_type: string;
  asset_description: string;
  asset_id?: string;
  condition_notes?: string;
  returned: boolean;
  returned_date?: string;
}

export default function Exit() {
  const { toast } = useToast();
  const [showExitModal, setShowExitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exitRequest, setExitRequest] = useState<ExitRequest | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const fetchExitData = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Fetch exit request
      const { data: exitData, error: exitError } = await supabase
        .from("exit_requests")
        .select("*")
        .eq("employee_id", user.data.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (exitError) throw exitError;

      if (exitData) {
        setExitRequest(exitData);

        // Fetch checklist items
        const { data: checklistData, error: checklistError } = await supabase
          .from("exit_checklist_items")
          .select("*")
          .eq("exit_request_id", exitData.id)
          .order("order_index");

        if (checklistError) throw checklistError;
        setChecklist(checklistData || []);

        // Fetch assets
        const { data: assetsData, error: assetsError } = await supabase
          .from("exit_assets")
          .select("*")
          .eq("exit_request_id", exitData.id);

        if (assetsError) throw assetsError;
        setAssets(assetsData || []);
      }
    } catch (error: any) {
      console.error("Error fetching exit data:", error);
      toast({
        title: "Error",
        description: "Failed to load exit process data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExitData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      hr_review: "default",
      asset_verification: "secondary",
      final_approval: "default",
      completed: "secondary",
      cancelled: "destructive"
    };
    
    const labels: Record<string, string> = {
      pending: "Pending Review",
      hr_review: "HR Review",
      asset_verification: "Asset Verification",
      final_approval: "Final Approval",
      completed: "Completed",
      cancelled: "Cancelled"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const completedTasks = checklist.filter(task => task.completed).length;
  const progressPercentage = checklist.length > 0 ? (completedTasks / checklist.length) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading exit process...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Exit Management</h1>
          <p className="text-muted-foreground">Manage your departure process and transition</p>
        </div>
        {!exitRequest && (
          <Button onClick={() => setShowExitModal(true)} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Initiate Exit Process
          </Button>
        )}
      </div>

      {!exitRequest ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Exit Process</CardTitle>
            <CardDescription>
              You currently don't have an active exit process. If you're planning to leave the company, 
              you can initiate the exit process which will guide you through all necessary steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <User className="w-8 h-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Need to Leave?</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Initiate Exit Process" to start your departure procedure and ensure a smooth transition.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Exit Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Process Status</CardTitle>
              <CardDescription>Track your departure progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{completedTasks}/{checklist.length} completed</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Resignation Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exitRequest.resignation_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Proposed Last Day</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(exitRequest.proposed_last_working_day), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Final Last Day</p>
                      <p className="text-sm text-muted-foreground">
                        {exitRequest.final_last_working_day 
                          ? format(new Date(exitRequest.final_last_working_day), "MMM dd, yyyy")
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(exitRequest.status)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exit Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Checklist</CardTitle>
              <CardDescription>Complete these tasks for a smooth departure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0 mt-1">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.task_title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.task_description}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-blue-600 mt-1 italic">
                          Note: {item.notes}
                        </p>
                      )}
                      {item.completed_at && (
                        <p className="text-xs text-green-600 mt-1">
                          Completed on {format(new Date(item.completed_at), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant={item.completed ? "outline" : "default"} 
                      size="sm"
                      disabled={item.completed}
                    >
                      {item.completed ? "Completed" : "Pending"}
                    </Button>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Circle className="w-8 h-8 mx-auto mb-2" />
                    <p>No checklist items available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Asset Handover Status */}
          {assets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Asset Handover Status</CardTitle>
                <CardDescription>Track the return of company assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{asset.asset_description}</h4>
                        <p className="text-sm text-muted-foreground">
                          Type: {asset.asset_type} {asset.asset_id && `• ID: ${asset.asset_id}`}
                        </p>
                        {asset.condition_notes && (
                          <p className="text-xs text-muted-foreground">
                            Condition: {asset.condition_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {asset.returned ? (
                          <div className="text-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            <p className="text-xs text-green-600 mt-1">
                              {asset.returned_date && format(new Date(asset.returned_date), "MMM dd")}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Circle className="w-5 h-5 text-orange-500 mx-auto" />
                            <p className="text-xs text-orange-600 mt-1">Pending</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exit Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">Reason for Leaving</h4>
                <p className="text-sm text-muted-foreground">{exitRequest.resignation_reason}</p>
              </div>
              
              {exitRequest.detailed_reason && (
                <div>
                  <h4 className="font-medium">Detailed Explanation</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exitRequest.detailed_reason}</p>
                </div>
              )}
              
              {exitRequest.handover_notes && (
                <div>
                  <h4 className="font-medium">Handover Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exitRequest.handover_notes}</p>
                </div>
              )}
              
              {(exitRequest.hr_comments || exitRequest.admin_comments) && (
                <div>
                  <h4 className="font-medium flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments from Management
                  </h4>
                  {exitRequest.hr_comments && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">HR Comments:</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">{exitRequest.hr_comments}</p>
                    </div>
                  )}
                  {exitRequest.admin_comments && (
                    <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Admin Comments:</p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 whitespace-pre-wrap">{exitRequest.admin_comments}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Notice Period</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Standard notice period is 2 weeks. Please submit your resignation letter accordingly.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Benefits Information</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your health insurance will continue until the end of the month. Contact HR for COBRA options.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Contact Information</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                For questions about the exit process, contact HR at hr@nafgem.com or extension 1234.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ExitRequestModal
        open={showExitModal}
        onOpenChange={setShowExitModal}
        onSubmitted={fetchExitData}
      />
    </div>
  );
}