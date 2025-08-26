import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface WeeklyTarget {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  priority: string;
  status: string;
  week_start_date: string;
  week_end_date: string;
  kpi_title?: string;
  kpi_unit?: string;
  total_progress?: number;
  task_count?: number;
}

interface TaskSuggestion {
  targetId: string;
  title: string;
  description: string;
  priority: string;
  estimatedHours: number;
}

export function MyWeeklyTargets() {
  const [targets, setTargets] = useState<WeeklyTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadMyTargets = async () => {
    try {
      setLoading(true);
      
      // Get current week's targets assigned to the user
      const today = new Date();
      const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const { data, error } = await supabase
        .from('weekly_target_progress')
        .select('*')
        .eq('assigned_to', (await supabase.auth.getUser()).data.user?.id)
        .gte('week_start_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('week_start_date', format(weekEnd, 'yyyy-MM-dd'))
        .eq('status', 'active')
        .order('priority', { ascending: false });

      if (error) throw error;

      setTargets(data || []);
    } catch (error) {
      console.error('Error loading my targets:', error);
      toast({
        title: "Error",
        description: "Failed to load your weekly targets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyTargets();
  }, []);

  const handleCreateTask = (target: WeeklyTarget) => {
    const taskSuggestion: TaskSuggestion = {
      targetId: target.id,
      title: `Work on: ${target.title}`,
      description: target.description || `Focus on achieving the weekly target: ${target.title}`,
      priority: target.priority,
      estimatedHours: Math.ceil(target.target_value / 10), // Simple estimation
    };

    // Store the task suggestion in localStorage for the WeeklyTaskSubmission component
    const existingSuggestions = JSON.parse(localStorage.getItem('taskSuggestions') || '[]');
    const updatedSuggestions = [...existingSuggestions, taskSuggestion];
    localStorage.setItem('taskSuggestions', JSON.stringify(updatedSuggestions));

    toast({
      title: "Task Suggestion Created",
      description: "Navigate to Tasks to create this task from your weekly target",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (progress: number) => {
    if (progress >= 100) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (progress >= 50) return <Clock className="w-5 h-5 text-yellow-500" />;
    return <AlertTriangle className="w-5 h-5 text-red-500" />;
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 100) return "Completed";
    if (progress >= 75) return "On Track";
    if (progress >= 50) return "In Progress";
    if (progress >= 25) return "Behind";
    return "Not Started";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">My Weekly Targets</h2>
        <p className="text-muted-foreground">Track your weekly targets and create tasks to achieve them</p>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading your targets...</div>
      ) : targets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Weekly Targets</h3>
            <p className="text-muted-foreground">
              You don't have any weekly targets assigned for this week.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {targets.map((target) => (
            <Card key={target.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(target.total_progress || 0)}
                    <Badge variant={getPriorityColor(target.priority)}>
                      {target.priority}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateTask(target)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Task
                  </Button>
                </div>
                <div>
                  <CardTitle className="text-lg">{target.title}</CardTitle>
                  <CardDescription>
                    Week of {format(new Date(target.week_start_date), 'MMM dd')} - {format(new Date(target.week_end_date), 'MMM dd')}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {target.description && (
                  <p className="text-sm text-muted-foreground">{target.description}</p>
                )}

                {target.kpi_title && (
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span>KPI: {target.kpi_title}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target: {target.target_value}{target.kpi_unit && ` ${target.kpi_unit}`}</span>
                    <span className="font-medium">{getProgressLabel(target.total_progress || 0)}</span>
                  </div>
                  <Progress value={target.total_progress || 0} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(target.total_progress || 0)}% complete</span>
                    <span>{target.task_count || 0} tasks</span>
                  </div>
                </div>

                {(target.total_progress || 0) < 50 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Action Needed</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Consider creating tasks to achieve this weekly target.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}