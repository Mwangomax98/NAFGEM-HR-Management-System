import { useState, useEffect } from "react";
import { supabase } from "@/lib/api";
import { STAFF_REQUEST_TYPES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function typeLabel(value: string) {
  return STAFF_REQUEST_TYPES.find((t) => t.value === value)?.label || value;
}

export default function HRStaffRequestReview() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("staff_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch staff requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, action: "approve" | "reject") => {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;

    if (action === "reject" && !reviewComments.trim()) {
      toast({
        title: "Comment required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const newComment = {
        user: "HR Reviewer",
        userId: user?.id,
        date: new Date().toISOString(),
        message: reviewComments || `Request ${action}ed by HR.`,
      };

      const { error } = await supabase
        .from("staff_requests")
        .update({
          status: action === "approve" ? "hr_approved" : "rejected",
          hr_comments: [...(request.hr_comments || []), newComment],
          hr_approved_date: action === "approve" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: action === "approve" ? "Approved" : "Rejected",
        description: `${request.ref_number} ${action === "approve" ? "sent for final approval" : "rejected"}.`,
      });
      setReviewComments("");
      setSelectedId(null);
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update request.",
        variant: "destructive",
      });
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const reviewed = requests.filter((r) =>
    ["hr_approved", "rejected", "final_approved", "rejected_final"].includes(r.status)
  );
  const list = activeTab === "pending" ? pending : reviewed;

  if (loading) {
    return <div className="container mx-auto px-6 py-8">Loading…</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HR Review — Staff Requests</CardTitle>
          <CardDescription>
            Stage 1 approval. Approved requests go to admin for final decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({reviewed.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {list.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No requests in this queue.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.ref_number}</TableCell>
                        <TableCell>{r.requester_name || "—"}</TableCell>
                        <TableCell>{typeLabel(r.request_type)}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{r.title}</TableCell>
                        <TableCell className="capitalize">{r.priority}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.status.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog
                            open={selectedId === r.id}
                            onOpenChange={(open) => {
                              setSelectedId(open ? r.id : null);
                              if (!open) setReviewComments("");
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>{r.title}</DialogTitle>
                                <DialogDescription>
                                  {r.ref_number} · {typeLabel(r.request_type)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 text-sm">
                                <p>
                                  <strong>From:</strong> {r.requester_name}
                                </p>
                                <p>
                                  <strong>Priority:</strong> {r.priority}
                                </p>
                                {r.location && (
                                  <p>
                                    <strong>Location:</strong> {r.location}
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap border rounded p-3 bg-muted/40">
                                  {r.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {format(new Date(r.created_at), "dd MMM yyyy HH:mm")}
                                </p>

                                {r.status === "pending" && (
                                  <>
                                    <Textarea
                                      placeholder="Review comments (required for rejection)"
                                      value={reviewComments}
                                      onChange={(e) => setReviewComments(e.target.value)}
                                      rows={3}
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleApproval(r.id, "reject")}
                                      >
                                        <X className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                      <Button onClick={() => handleApproval(r.id, "approve")}>
                                        <Check className="w-4 h-4 mr-1" />
                                        Approve
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
