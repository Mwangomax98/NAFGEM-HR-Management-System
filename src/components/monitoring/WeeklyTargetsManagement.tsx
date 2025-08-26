import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Target, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";

interface KPI {
  id: string;
  title: string;
  unit: string;
  project_id: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
}

interface WeeklyTarget {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  priority: string;
  status: string;
  week_start_date: string;
  week_end_date: string;
  kpi_id: string;
  assigned_to: string;
  assigned_to_name?: string;
  kpi_title?: string;
  kpi_unit?: string;
  total_progress?: number;
  task_count?: number;
}

interface WeeklyTargetFormData {
  title: string;
  description: string;
  target_value: string;
  priority: string;
  kpi_id: string;
  assigned_to: string;
  week_start_date: string;
}

export function WeeklyTargetsManagement() {
  const [targets, setTargets] = useState<WeeklyTarget[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<WeeklyTarget | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<WeeklyTargetFormData>({
    title: "",
    description: "",
    target_value: "",
    priority: "medium",
    kpi_id: "",
    assigned_to: "",
    week_start_date: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load weekly targets with progress
      const { data: targetsData, error: targetsError } = await supabase
        .from('weekly_target_progress')
        .select('*')
        .order('week_start_date', { ascending: false });

      if (targetsError) throw targetsError;

      // Load KPIs
      const { data: kpisData, error: kpisError } = await supabase
        .from('kpis')
        .select('id, title, unit, project_id')
        .eq('is_active', true);

      if (kpisError) throw kpisError;

      // Load employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (employeesError) throw employeesError;

      setTargets(targetsData || []);
      setKpis(kpisData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load weekly targets data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const weekStart = new Date(formData.week_start_date);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

      const targetData = {
        title: formData.title,
        description: formData.description || null,
        target_value: parseFloat(formData.target_value),
        priority: formData.priority,
        kpi_id: formData.kpi_id || null,
        assigned_to: formData.assigned_to,
        week_start_date: format(weekStart, 'yyyy-MM-dd'),
        week_end_date: format(weekEnd, 'yyyy-MM-dd'),
        status: 'active',
      };

      if (editingTarget) {
        const { error } = await supabase
          .from('weekly_targets')
          .update(targetData)
          .eq('id', editingTarget.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Weekly target updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('weekly_targets')
          .insert([targetData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Weekly target created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving weekly target:', error);
      toast({
        title: "Error",
        description: "Failed to save weekly target",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_value: "",
      priority: "medium",
      kpi_id: "",
      assigned_to: "",
      week_start_date: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    });
    setEditingTarget(null);
  };

  const handleEdit = (target: WeeklyTarget) => {
    setEditingTarget(target);
    setFormData({
      title: target.title,
      description: target.description || "",
      target_value: target.target_value.toString(),
      priority: target.priority,
      kpi_id: target.kpi_id || "",
      assigned_to: target.assigned_to,
      week_start_date: target.week_start_date,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('weekly_targets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Weekly target deleted successfully",
      });
      loadData();
    } catch (error) {
      console.error('Error deleting weekly target:', error);
      toast({
        title: "Error",
        description: "Failed to delete weekly target",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Weekly Targets Management</h2>
          <p className="text-muted-foreground">Create and manage weekly targets for employees</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Weekly Target
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTarget ? 'Edit Weekly Target' : 'Create Weekly Target'}
              </DialogTitle>
              <DialogDescription>
                Set weekly targets for employees to drive KPI performance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Target Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Increase website traffic"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    placeholder="e.g., 1000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the target and expected outcomes..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kpi_id">Related KPI (Optional)</Label>
                  <Select value={formData.kpi_id} onValueChange={(value) => setFormData({ ...formData, kpi_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select KPI" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No KPI</SelectItem>
                      {kpis.map((kpi) => (
                        <SelectItem key={kpi.id} value={kpi.id}>
                          {kpi.title} ({kpi.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="assigned_to">Assign To</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="week_start_date">Week Starting</Label>
                <Input
                  id="week_start_date"
                  type="date"
                  value={formData.week_start_date}
                  onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                  required
                />
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingTarget ? 'Update Target' : 'Create Target'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weekly Targets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly Targets
          </CardTitle>
          <CardDescription>
            Monitor and manage weekly targets across all employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading weekly targets...</div>
          ) : targets.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No weekly targets found</p>
              <p className="text-sm text-muted-foreground">Create your first weekly target to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Week Period</TableHead>
                  <TableHead>KPI</TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{target.title}</div>
                        {target.description && (
                          <div className="text-sm text-muted-foreground">{target.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {target.assigned_to_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(target.week_start_date), 'MMM dd')} - {format(new Date(target.week_end_date), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {target.kpi_title ? (
                        <span className="text-sm">{target.kpi_title}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No KPI</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{target.target_value}</span>
                      {target.kpi_unit && <span className="text-sm text-muted-foreground ml-1">{target.kpi_unit}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${getProgressColor(target.total_progress || 0)}`}
                              style={{ width: `${Math.min((target.total_progress || 0), 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{Math.round(target.total_progress || 0)}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{target.task_count || 0} tasks</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(target.priority)}>
                        {target.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(target)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(target.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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