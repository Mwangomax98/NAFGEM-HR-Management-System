import { useState, useEffect } from "react";
import { supabase } from "@/lib/api";
import { STAFF_REQUEST_TYPES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending HR Review" },
  hr_approved: { bg: "bg-blue-100", text: "text-blue-800", label: "HR Approved" },
  final_approved: { bg: "bg-green-100", text: "text-green-800", label: "Final Approved" },
  rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  rejected_final: { bg: "bg-red-100", text: "text-red-800", label: "Final Rejected" },
};

function typeLabel(value: string) {
  return STAFF_REQUEST_TYPES.find((t) => t.value === value)?.label || value;
}

export default function MyStaffRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("staff_requests")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch your staff requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.ref_number?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.request_type?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, status: string) => {
    if (status !== "pending") {
      toast({
        title: "Cannot delete",
        description: "Only pending requests can be deleted.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase.from("staff_requests").delete().eq("id", id);
      if (error) throw error;
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Deleted", description: "Request removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete request.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusColors[status] || statusColors.pending;
    return (
      <Badge variant="outline" className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="container mx-auto px-6 py-8">Loading…</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Staff Requests</CardTitle>
          <CardDescription>Track submissions and approval status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by ref, title, or type…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="hr_approved">HR Approved</SelectItem>
                <SelectItem value="final_approved">Final Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="rejected_final">Final Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.ref_number}</TableCell>
                    <TableCell>{typeLabel(r.request_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.title}</TableCell>
                    <TableCell className="capitalize">{r.priority}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(r.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{r.title}</DialogTitle>
                            <DialogDescription>{r.ref_number}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3 text-sm">
                            <p>
                              <strong>Type:</strong> {typeLabel(r.request_type)}
                            </p>
                            <p>
                              <strong>Priority:</strong> {r.priority}
                            </p>
                            {r.location && (
                              <p>
                                <strong>Location:</strong> {r.location}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{r.description}</p>
                            {getStatusBadge(r.status)}
                            {(r.hr_comments?.length > 0 || r.admin_comments?.length > 0) && (
                              <div className="border-t pt-3 space-y-2">
                                <p className="font-medium">Comments</p>
                                {[...(r.hr_comments || []), ...(r.admin_comments || [])].map(
                                  (c: any, i: number) => (
                                    <div key={i} className="bg-muted rounded p-2">
                                      <p className="text-xs text-muted-foreground">
                                        {c.user} · {c.date ? format(new Date(c.date), "dd MMM yyyy HH:mm") : ""}
                                      </p>
                                      <p>{c.message}</p>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {r.status === "pending" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {r.ref_number}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(r.id, r.status)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
