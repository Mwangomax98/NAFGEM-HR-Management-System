import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, Send, Save, Calendar, Target, Clock, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";


interface TaskSuggestion {
  targetId?: string;
  title: string;
  description: string;
  priority: string;
  estimatedHours: number;
}
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { checkRateLimit, RATE_LIMITS, getRateLimitResetTime } from "@/utils/rateLimiter";
import { logRateLimitExceeded } from "@/utils/auditLogger";

interface TaskSubmission {
  id?: string;
  task_title: string;
  task_description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_hours: number;
  actual_hours: number;
  completion_status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  completion_percentage: number;
  notes: string;
  planned_completion_date: string | null;
  actual_completion_date: string | null;
  completion_explanation: string;
  task_category: string;
  linked_kpi_id?: string;
}

interface WeeklyTask {
  id?: string;
  week_start_date: string;
  week_end_date: string;
  status: 'draft' | 'submitted' | 'under_review' | 'evaluated';
  tasks: TaskSubmission[];
}

export default function WeeklyTaskSubmission() {
  const [weeklyTask, setWeeklyTask] = useState<WeeklyTask | null>(null);
  const [taskSuggestions, setTaskSuggestions] = useState<TaskSuggestion[]>([]);
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    return {
      start: format(monday, 'yyyy-MM-dd'),
      end: format(endOfWeek(monday, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      display: `${format(monday, 'MMM dd')} - ${format(addDays(monday, 6), 'MMM dd, yyyy')}`
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyTasks();
    loadTaskSuggestions();
  }, [currentWeek]);

  const loadTaskSuggestions = () => {
    const suggestions = JSON.parse(localStorage.getItem('taskSuggestions') || '[]');
    setTaskSuggestions(suggestions);
  };

  const loadWeeklyTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if weekly task exists for current week
      const { data: existingWeeklyTask, error: weekError } = await supabase
        .from('weekly_tasks')
        .select(`
          *,
          task_submissions (*)
        `)
        .eq('employee_id', user.id)
        .eq('week_start_date', currentWeek.start)
        .single();

      if (weekError && weekError.code !== 'PGRST116') {
        throw weekError;
      }

      if (existingWeeklyTask) {
        setWeeklyTask({
          id: existingWeeklyTask.id,
          week_start_date: existingWeeklyTask.week_start_date,
          week_end_date: existingWeeklyTask.week_end_date,
          status: existingWeeklyTask.status as 'draft' | 'submitted' | 'under_review' | 'evaluated',
          tasks: (existingWeeklyTask.task_submissions || []).map((task: any) => ({
            id: task.id,
            task_title: task.task_title,
            task_description: task.task_description,
            priority: task.priority as 'low' | 'medium' | 'high' | 'urgent',
            estimated_hours: task.estimated_hours || 0,
            actual_hours: task.actual_hours || 0,
            completion_status: task.completion_status as 'not_started' | 'in_progress' | 'completed' | 'blocked',
            completion_percentage: task.completion_percentage || 0,
            notes: task.notes || '',
            planned_completion_date: task.planned_completion_date || null,
            actual_completion_date: task.actual_completion_date || null,
            completion_explanation: task.completion_explanation || '',
            task_category: task.task_category || 'general'
          }))
        });
      } else {
        // Create new weekly task
        setWeeklyTask({
          week_start_date: currentWeek.start,
          week_end_date: currentWeek.end,
          status: 'draft',
          tasks: []
        });
      }
    } catch (error) {
      console.error('Error loading weekly tasks:', error);
      toast.error('Failed to load weekly tasks');
    } finally {
      setLoading(false);
    }
  };

  const addNewTask = (taskData?: Partial<TaskSubmission>) => {
    if (!weeklyTask) return;
    
    // Set planned completion date to Friday of current week by default
    const friday = new Date(currentWeek.start);
    friday.setDate(friday.getDate() + 4);
    
    const newTask: TaskSubmission = {
      task_title: taskData?.task_title || '',
      task_description: taskData?.task_description || '',
      priority: taskData?.priority || 'medium',
      estimated_hours: taskData?.estimated_hours || 8,
      actual_hours: 0,
      completion_status: 'not_started',
      completion_percentage: 0,
      notes: '',
      planned_completion_date: format(friday, 'yyyy-MM-dd'),
      actual_completion_date: null,
      completion_explanation: '',
      task_category: taskData?.task_category || 'general',
      linked_kpi_id: taskData?.linked_kpi_id
    };

    setWeeklyTask({
      ...weeklyTask,
      tasks: [...weeklyTask.tasks, newTask]
    });
  };

  const handleUseSuggestion = (suggestion: TaskSuggestion) => {
    addNewTask({
      task_title: suggestion.title,
      task_description: suggestion.description,
      priority: suggestion.priority as any,
      estimated_hours: suggestion.estimatedHours,
    });
    
    // Remove the used suggestion and update localStorage
    const updatedSuggestions = taskSuggestions.filter(s => s !== suggestion);
    setTaskSuggestions(updatedSuggestions);
    localStorage.setItem('taskSuggestions', JSON.stringify(updatedSuggestions));
  };

  const updateTask = (index: number, field: keyof TaskSubmission, value: any) => {
    if (!weeklyTask) return;

    const updatedTasks = [...weeklyTask.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    
    setWeeklyTask({
      ...weeklyTask,
      tasks: updatedTasks
    });
  };

  const removeTask = (index: number) => {
    if (!weeklyTask) return;

    setWeeklyTask({
      ...weeklyTask,
      tasks: weeklyTask.tasks.filter((_, i) => i !== index)
    });
  };

  const saveWeeklyTask = async (submit = false) => {
    if (!weeklyTask) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check rate limit
      const rateLimitKey = `weekly-task-${user.id}`;
      if (!checkRateLimit(rateLimitKey, RATE_LIMITS.WEEKLY_TASK_SUBMISSION)) {
        const resetTime = getRateLimitResetTime(rateLimitKey);
        const minutes = Math.ceil(resetTime / 60000);
        
        await logRateLimitExceeded('weekly_task_submission');
        
        toast.error(`Too many saves. Please wait ${minutes} minutes before trying again.`);
        return;
      }

      let weeklyTaskId = weeklyTask.id;

      // Use UPSERT to handle duplicate key constraint
      const { data: weeklyTaskData, error: weekError } = await supabase
        .from('weekly_tasks')
        .upsert({
          employee_id: user.id,
          week_start_date: weeklyTask.week_start_date,
          week_end_date: weeklyTask.week_end_date,
          status: submit ? 'submitted' : 'draft',
          submitted_at: submit ? new Date().toISOString() : null
        }, {
          onConflict: 'employee_id,week_start_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (weekError) {
        console.error('Error saving weekly task:', weekError);
        throw weekError;
      }

      weeklyTaskId = weeklyTaskData.id;

      // Delete existing task submissions
      if (weeklyTask.id) {
        const { error: deleteError } = await supabase
          .from('task_submissions')
          .delete()
          .eq('weekly_task_id', weeklyTaskId);

        if (deleteError) throw deleteError;
      }

      // Insert new task submissions
      if (weeklyTask.tasks.length > 0) {
        const taskSubmissions = weeklyTask.tasks.map(task => ({
          weekly_task_id: weeklyTaskId,
          task_title: task.task_title,
          task_description: task.task_description,
          priority: task.priority,
          estimated_hours: task.estimated_hours,
          actual_hours: task.actual_hours,
          completion_status: task.completion_status,
          completion_percentage: task.completion_percentage,
          notes: task.notes,
          planned_completion_date: task.planned_completion_date,
          actual_completion_date: task.actual_completion_date,
          completion_explanation: task.completion_explanation,
          task_category: task.task_category,
          linked_kpi_id: task.linked_kpi_id
        }));

        const { error: insertError } = await supabase
          .from('task_submissions')
          .insert(taskSubmissions);

        if (insertError) throw insertError;
      }

      setWeeklyTask({
        ...weeklyTask,
        id: weeklyTaskId,
        status: submit ? 'submitted' : 'draft'
      });

      toast.success(submit ? 'Weekly tasks submitted successfully!' : 'Weekly tasks saved successfully!');
    } catch (error) {
      console.error('Error saving weekly task:', error);
      toast.error('Failed to save weekly tasks');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'blocked': return 'destructive';
      case 'not_started': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">Loading weekly tasks...</div>
        </CardContent>
      </Card>
    );
  }

  if (!weeklyTask) return null;

  const canEdit = weeklyTask.status === 'draft' || weeklyTask.status === 'under_review';
  const canEditProgress = weeklyTask.status === 'draft' || weeklyTask.status === 'under_review' || weeklyTask.status === 'submitted';
  const isSubmitted = weeklyTask.status === 'submitted' || weeklyTask.status === 'under_review' || weeklyTask.status === 'evaluated';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Tasks - {currentWeek.display}
              </CardTitle>
              <CardDescription>
                Submit your weekly tasks every Monday for HR review
              </CardDescription>
            </div>
            <Badge variant={isSubmitted ? "default" : "secondary"}>
              {weeklyTask.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyTask.tasks.map((task, index) => (
              <Card key={index} className="border-l-4 border-l-primary/20">
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge variant={getStatusColor(task.completion_status)}>
                          {task.completion_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Planning Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Target className="h-4 w-4" />
                        Task Planning
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Task Title *</Label>
                          <Input
                            value={task.task_title}
                            onChange={(e) => updateTask(index, 'task_title', e.target.value)}
                            placeholder="Enter task title"
                            disabled={!canEdit}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={task.task_category}
                            onValueChange={(value) => updateTask(index, 'task_category', value)}
                            disabled={!canEdit}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="meetings">Meetings</SelectItem>
                              <SelectItem value="documentation">Documentation</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={task.task_description}
                          onChange={(e) => updateTask(index, 'task_description', e.target.value)}
                          placeholder="Describe the task details"
                          disabled={!canEdit}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={task.priority}
                            onValueChange={(value) => updateTask(index, 'priority', value)}
                            disabled={!canEdit}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Estimated Hours</Label>
                          <Input
                            type="number"
                            min="0"
                            value={task.estimated_hours}
                            onChange={(e) => updateTask(index, 'estimated_hours', parseInt(e.target.value) || 0)}
                            disabled={!canEdit}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Planned Completion</Label>
                          <Input
                            type="date"
                            value={task.planned_completion_date || ''}
                            onChange={(e) => updateTask(index, 'planned_completion_date', e.target.value)}
                            disabled={!canEdit}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Progress Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Clock className="h-4 w-4" />
                        Progress Tracking
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={task.completion_status}
                            onValueChange={(value) => updateTask(index, 'completion_status', value)}
                            disabled={!canEditProgress}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="not_started">Not Started</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Actual Hours</Label>
                          <Input
                            type="number"
                            min="0"
                            value={task.actual_hours}
                            onChange={(e) => updateTask(index, 'actual_hours', parseInt(e.target.value) || 0)}
                            disabled={!canEditProgress}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Actual Completion</Label>
                          <Input
                            type="date"
                            value={task.actual_completion_date || ''}
                            onChange={(e) => updateTask(index, 'actual_completion_date', e.target.value)}
                            disabled={!canEditProgress}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Completion Percentage: {task.completion_percentage}%</Label>
                        <Slider
                          value={[task.completion_percentage]}
                          onValueChange={(value) => updateTask(index, 'completion_percentage', value[0])}
                          max={100}
                          step={5}
                          disabled={!canEditProgress}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Completion Explanation Section - Only show when completed */}
                    {task.completion_status === 'completed' && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <CheckCircle className="h-4 w-4" />
                            Completion Details
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Completion Explanation *</Label>
                            <Textarea
                              value={task.completion_explanation}
                              onChange={(e) => updateTask(index, 'completion_explanation', e.target.value)}
                              placeholder="Explain what was accomplished, any challenges faced, and outcomes achieved..."
                              disabled={!canEditProgress}
                              className="min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground">
                              Please provide a detailed explanation of what was completed for this task.
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    <Separator />

                    {/* Notes Section */}
                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea
                        value={task.notes}
                        onChange={(e) => updateTask(index, 'notes', e.target.value)}
                        placeholder="Any additional notes, blockers, or comments..."
                        disabled={!canEdit}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {canEdit && (
              <Button
                variant="outline"
                onClick={() => addNewTask()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Task
              </Button>
            )}

            {canEdit && weeklyTask.tasks.length > 0 && (
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => saveWeeklyTask(false)}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => saveWeeklyTask(true)}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              </div>
            )}

            {!canEdit && canEditProgress && weeklyTask.tasks.length > 0 && (
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => saveWeeklyTask(false)}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Progress
                </Button>
              </div>
            )}

            {isSubmitted && (
              <div className="text-center py-4 text-muted-foreground">
                Tasks have been submitted and are under review by HR
              </div>
            )}
          </div>
        </CardContent>
        </Card>

        {/* Task Suggestions from Weekly Targets */}
        {taskSuggestions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Suggested Tasks from Weekly Targets
              </CardTitle>
              <CardDescription>
                Create tasks based on your assigned weekly targets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{suggestion.priority} priority</Badge>
                      <Badge variant="outline">{suggestion.estimatedHours}h estimated</Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    Use Suggestion
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </div>
    );
  }