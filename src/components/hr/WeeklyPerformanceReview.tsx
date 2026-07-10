import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, User, Search, Filter } from "lucide-react";
import { supabase } from "@/lib/api";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import TaskEvaluationModal from "@/components/modals/TaskEvaluationModal";

interface WeeklyTaskSummary {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  week_start_date: string;
  week_end_date: string;
  status: string;
  submitted_at: string;
  task_count: number;
  completion_rate: number;
  total_estimated_hours: number;
  total_actual_hours: number;
}

interface TaskSubmissionDetails {
  id: string;
  task_title: string;
  task_description: string;
  priority: string;
  estimated_hours: number;
  actual_hours: number;
  completion_status: string;
  completion_percentage: number;
  notes: string;
  evaluation?: {
    performance_score: number;
    completion_assessment: string;
    feedback: string;
    requires_explanation: boolean;
  };
}

export default function WeeklyPerformanceReview() {
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskSummary[]>([]);
  const [selectedWeeklyTask, setSelectedWeeklyTask] = useState<string | null>(null);
  const [taskDetails, setTaskDetails] = useState<TaskSubmissionDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return format(monday, 'yyyy-MM-dd');
  });

  useEffect(() => {
    loadWeeklyTasks();
  }, [statusFilter, weekFilter]);

  const loadWeeklyTasks = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('weekly_tasks')
        .select('id, employee_id, week_start_date, week_end_date, status, submitted_at');

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (weekFilter) {
        query = query.eq('week_start_date', weekFilter);
      }

      const { data, error } = await query.order('week_start_date', { ascending: false });

      if (error) throw error;

      const weeklyIds = data?.map(task => task.id) || [];
      let submissionsByWeek: Record<string, any[]> = {};
      if (weeklyIds.length) {
        const { data: submissions } = await supabase
          .from('task_submissions')
          .select('id, weekly_task_id, estimated_hours, actual_hours, completion_percentage')
          .in('weekly_task_id', weeklyIds);
        for (const s of submissions || []) {
          if (!submissionsByWeek[s.weekly_task_id]) submissionsByWeek[s.weekly_task_id] = [];
          submissionsByWeek[s.weekly_task_id].push(s);
        }
      }

      // Get employee profiles separately
      const employeeIds = data?.map(task => task.employee_id) || [];
      const { data: profiles } = employeeIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', employeeIds)
        : { data: [] as any[] };

      const formattedData: WeeklyTaskSummary[] = data?.map(task => {
        const tasks = submissionsByWeek[task.id] || [];
        const totalEstimated = tasks.reduce((sum: number, t: any) => sum + (t.estimated_hours || 0), 0);
        const totalActual = tasks.reduce((sum: number, t: any) => sum + (t.actual_hours || 0), 0);
        const avgCompletion = tasks.length > 0 
          ? tasks.reduce((sum: number, t: any) => sum + (t.completion_percentage || 0), 0) / tasks.length
          : 0;

        const profile = profiles?.find(p => p.id === task.employee_id);

        return {
          id: task.id,
          employee_id: task.employee_id,
          employee_name: profile?.full_name || 'Unknown',
          employee_email: profile?.email || '',
          week_start_date: task.week_start_date,
          week_end_date: task.week_end_date,
          status: task.status,
          submitted_at: task.submitted_at,
          task_count: tasks.length,
          completion_rate: Math.round(avgCompletion),
          total_estimated_hours: totalEstimated,
          total_actual_hours: totalActual
        };
      }) || [];

      setWeeklyTasks(formattedData);
    } catch (error) {
      console.error('Error loading weekly tasks:', error);
      toast.error('Failed to load weekly tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (weeklyTaskId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('weekly_task_id', weeklyTaskId);

      if (error) throw error;

      const submissionIds = (data || []).map((t: any) => t.id);
      let evalBySubmission: Record<string, any> = {};
      if (submissionIds.length) {
        const { data: evaluations } = await supabase
          .from('task_evaluations')
          .select('task_submission_id, performance_score, completion_assessment, feedback, requires_explanation')
          .in('task_submission_id', submissionIds);
        for (const ev of evaluations || []) {
          evalBySubmission[ev.task_submission_id] = ev;
        }
      }

      const formattedTasks: TaskSubmissionDetails[] = data?.map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_description: task.task_description,
        priority: task.priority,
        estimated_hours: task.estimated_hours || 0,
        actual_hours: task.actual_hours || 0,
        completion_status: task.completion_status,
        completion_percentage: task.completion_percentage || 0,
        notes: task.notes || '',
        evaluation: evalBySubmission[task.id] || undefined
      })) || [];

      setTaskDetails(formattedTasks);
      setSelectedWeeklyTask(weeklyTaskId);
    } catch (error) {
      console.error('Error loading task details:', error);
      toast.error('Failed to load task details');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default">Submitted</Badge>;
      case 'under_review':
        return <Badge variant="default">Under Review</Badge>;
      case 'evaluated':
        return <Badge variant="default">Evaluated</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="default">Excellent</Badge>;
    if (percentage >= 70) return <Badge variant="default">Good</Badge>;
    if (percentage >= 50) return <Badge variant="default">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const filteredTasks = weeklyTasks.filter(task =>
    task.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.employee_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startReview = async (weeklyTaskId: string) => {
    try {
      const { error } = await supabase
        .from('weekly_tasks')
        .update({ status: 'under_review' })
        .eq('id', weeklyTaskId);

      if (error) throw error;

      toast.success('Review started');
      loadWeeklyTasks();
    } catch (error) {
      console.error('Error starting review:', error);
      toast.error('Failed to start review');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Performance Reviews
          </CardTitle>
          <CardDescription>
            Review employee weekly task submissions and provide feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="evaluated">Evaluated</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="w-48"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading weekly tasks...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week Period</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.employee_name}</div>
                        <div className="text-sm text-muted-foreground">{task.employee_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(task.week_start_date), 'MMM dd')} - 
                        {format(new Date(task.week_end_date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>{task.task_count}</TableCell>
                    <TableCell>{getCompletionBadge(task.completion_rate)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{task.total_actual_hours}h actual</div>
                        <div className="text-muted-foreground">{task.total_estimated_hours}h estimated</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      {task.submitted_at && (
                        <div className="text-sm">
                          {format(new Date(task.submitted_at), 'MMM dd, HH:mm')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadTaskDetails(task.id)}
                        >
                          View Tasks
                        </Button>
                        {task.status === 'submitted' && (
                          <Button
                            size="sm"
                            onClick={() => startReview(task.id)}
                          >
                            Start Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredTasks.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No weekly tasks found for the selected criteria
            </div>
          )}
        </CardContent>
      </Card>

      {selectedWeeklyTask && taskDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Task Details
            </CardTitle>
            <CardDescription>
              Individual task submissions for evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskDetails.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{task.task_title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.task_description}</p>
                      </div>
                      <div className="flex gap-2">
                        {getPriorityBadge(task.priority)}
                        <Badge variant={task.completion_percentage >= 90 ? "default" : "secondary"}>
                          {task.completion_percentage}% Complete
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Estimated</div>
                        <div className="font-medium">{task.estimated_hours}h</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Actual</div>
                        <div className="font-medium">{task.actual_hours}h</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="font-medium capitalize">{task.completion_status.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Progress</div>
                        <div className="font-medium">{task.completion_percentage}%</div>
                      </div>
                    </div>

                    {task.notes && (
                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Notes</div>
                        <p className="text-sm">{task.notes}</p>
                      </div>
                    )}

                    {task.evaluation ? (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-2">Evaluation</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Score</div>
                            <div>{task.evaluation.performance_score}/5</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Assessment</div>
                            <div className="capitalize">{task.evaluation.completion_assessment?.replace('_', ' ')}</div>
                          </div>
                        </div>
                        {task.evaluation.feedback && (
                          <div className="mt-2">
                            <div className="text-sm text-muted-foreground">Feedback</div>
                            <p className="text-sm">{task.evaluation.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <TaskEvaluationModal
                        taskSubmission={task}
                        onEvaluationComplete={() => {
                          loadTaskDetails(selectedWeeklyTask);
                          loadWeeklyTasks();
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}