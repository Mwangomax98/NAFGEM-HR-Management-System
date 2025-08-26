import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KPI {
  id: string;
  project_id: string;
  title: string;
  description: string;
  unit: string;
  target_value: number;
  timeframe: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

interface KPIFormData {
  project_id: string;
  title: string;
  description: string;
  unit: string;
  target_value: number;
  timeframe: string;
  category: string;
}

export function KPIManagement() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<KPIFormData>({
    project_id: '',
    title: '',
    description: '',
    unit: '',
    target_value: 0,
    timeframe: 'quarterly',
    category: 'general'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast({
        title: "Error",
        description: "Failed to load KPIs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('kpis')
        .insert([formData]);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "KPI created successfully",
      });
      
      setShowCreateDialog(false);
      setFormData({
        project_id: '',
        title: '',
        description: '',
        unit: '',
        target_value: 0,
        timeframe: 'quarterly',
        category: 'general'
      });
      loadKPIs();
    } catch (error) {
      console.error('Error creating KPI:', error);
      toast({
        title: "Error",
        description: "Failed to create KPI",
        variant: "destructive",
      });
    }
  };

  const handleUpdateKPI = async (kpi: KPI) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({
          project_id: kpi.project_id,
          title: kpi.title,
          description: kpi.description,
          unit: kpi.unit,
          target_value: kpi.target_value,
          timeframe: kpi.timeframe,
          category: kpi.category,
        })
        .eq('id', kpi.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "KPI updated successfully",
      });
      
      setEditingKPI(null);
      loadKPIs();
    } catch (error) {
      console.error('Error updating KPI:', error);
      toast({
        title: "Error",
        description: "Failed to update KPI",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (kpi: KPI) => {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({ is_active: !kpi.is_active })
        .eq('id', kpi.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `KPI ${kpi.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      
      loadKPIs();
    } catch (error) {
      console.error('Error toggling KPI status:', error);
      toast({
        title: "Error",
        description: "Failed to update KPI status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      title: '',
      description: '',
      unit: '',
      target_value: 0,
      timeframe: 'quarterly',
      category: 'general'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">KPI Management</h2>
          <p className="text-muted-foreground">
            Create and manage Key Performance Indicators for your organization
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create KPI
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New KPI</DialogTitle>
              <DialogDescription>
                Define a new Key Performance Indicator to track organizational performance
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateKPI} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Project ID</Label>
                  <Input
                    id="project_id"
                    value={formData.project_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                    placeholder="Enter project identifier"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="outcome">Outcome</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">KPI Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter KPI title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this KPI measures"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Target Value</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    value={formData.target_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="%, #, $, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select
                    value={formData.timeframe}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Create KPI
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current KPIs</CardTitle>
          <CardDescription>
            Manage existing Key Performance Indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI Details</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Timeframe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map((kpi) => (
                <TableRow key={kpi.id}>
                  <TableCell>
                    {editingKPI?.id === kpi.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingKPI.title}
                          onChange={(e) => setEditingKPI(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="font-medium"
                        />
                        <Textarea
                          value={editingKPI.description}
                          onChange={(e) => setEditingKPI(prev => prev ? { ...prev, description: e.target.value } : null)}
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{kpi.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {kpi.description}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          {kpi.category}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingKPI?.id === kpi.id ? (
                      <Input
                        value={editingKPI.project_id}
                        onChange={(e) => setEditingKPI(prev => prev ? { ...prev, project_id: e.target.value } : null)}
                      />
                    ) : (
                      kpi.project_id
                    )}
                  </TableCell>
                  <TableCell>
                    {editingKPI?.id === kpi.id ? (
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editingKPI.target_value}
                          onChange={(e) => setEditingKPI(prev => prev ? { ...prev, target_value: parseFloat(e.target.value) || 0 } : null)}
                          className="w-20"
                        />
                        <Input
                          value={editingKPI.unit}
                          onChange={(e) => setEditingKPI(prev => prev ? { ...prev, unit: e.target.value } : null)}
                          className="w-16"
                        />
                      </div>
                    ) : (
                      <span className="font-mono">{kpi.target_value}{kpi.unit}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingKPI?.id === kpi.id ? (
                      <Select
                        value={editingKPI.timeframe}
                        onValueChange={(value) => setEditingKPI(prev => prev ? { ...prev, timeframe: value } : null)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">{kpi.timeframe}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={kpi.is_active ? "default" : "secondary"}>
                      {kpi.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {editingKPI?.id === kpi.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateKPI(editingKPI)}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingKPI(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingKPI(kpi)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={kpi.is_active ? "outline" : "default"}
                            onClick={() => handleToggleActive(kpi)}
                          >
                            {kpi.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {kpis.length === 0 && (
            <div className="text-center py-8">
              <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No KPIs Defined</h3>
              <p className="text-muted-foreground mb-4">
                Create your first KPI to start tracking organizational performance
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First KPI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}