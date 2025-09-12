import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AlertTriangle, TrendingDown, Plus, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface KPIGap {
  kpi_id: string;
  title: string;
  project_id: string;
  target_value: number;
  actual_value: number;
  gap_value: number;
  status: string;
  unit: string;
  category: string;
  timeframe: string;
  latest_comment: string;
}

export function GapAnalysis() {
  const [gaps, setGaps] = useState<KPIGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { userRole } = useUserRole();
  const { toast } = useToast();
  const isHROrAdmin = userRole === 'hr' || userRole === 'admin';

  useEffect(() => {
    loadGaps();
  }, []);

  const loadGaps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kpi_gaps')
        .select('*')
        .neq('status', 'on_track')
        .order('gap_value', { ascending: false });
      
      if (error) throw error;
      setGaps(data || []);
    } catch (error) {
      console.error('Error loading gaps:', error);
      toast({
        title: "Error",
        description: "Failed to load performance gaps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = (gap: KPIGap) => {
    // This will be used to suggest tasks based on gaps
    const taskSuggestion = {
      title: `Address ${gap.title} Performance Gap`,
      description: `Work to improve ${gap.title} from ${gap.actual_value}${gap.unit} to ${gap.target_value}${gap.unit}`,
      category: gap.category,
      priority: gap.status === 'gap' ? 'high' : 'medium',
      linked_kpi_id: gap.kpi_id
    };
    
    // Store in localStorage to be picked up by Tasks page
    localStorage.setItem('suggestedTask', JSON.stringify(taskSuggestion));
    
    toast({
      title: "Task Suggestion Created",
      description: "Go to My Tasks to see the suggested task based on this gap",
    });
  };

  const filteredGaps = gaps.filter(gap =>
    gap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gap.project_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gap.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'slightly_off': return 'bg-yellow-500 text-white';
      case 'gap': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLevel = (gapValue: number, targetValue: number) => {
    const gapPercentage = (gapValue / targetValue) * 100;
    if (gapPercentage > 50) return 'High';
    if (gapPercentage > 20) return 'Medium';
    return 'Low';
  };

  const getSuggestedFocus = (gap: KPIGap) => {
    const suggestions = {
      'operational': 'Improve process efficiency and resource allocation',
      'financial': 'Review budget allocation and cost optimization',
      'outcome': 'Focus on service delivery and beneficiary impact',
      'general': 'Review implementation strategy and timelines'
    };
    return suggestions[gap.category as keyof typeof suggestions] || 'Review performance strategy';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">Performance Gaps</h2>
          <p className="text-muted-foreground">
            Identify and address performance shortfalls to improve outcomes
          </p>
        </div>
        {isHROrAdmin && (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gaps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {gaps.filter(g => g.status === 'gap').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderate Gaps</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {gaps.filter(g => g.status === 'slightly_off').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gap Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gaps.reduce((sum, gap) => sum + gap.gap_value, 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined performance shortfall
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gaps Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Gaps Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of KPIs not meeting targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Gap</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Suggested Focus</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGaps.map((gap) => (
                <TableRow key={gap.kpi_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{gap.title}</div>
                      <Badge className={getStatusColor(gap.status)} variant="secondary">
                        {gap.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{gap.project_id}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {gap.category} • {gap.timeframe}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {gap.target_value}{gap.unit}
                  </TableCell>
                  <TableCell className="font-mono">
                    {gap.actual_value}{gap.unit}
                  </TableCell>
                  <TableCell>
                    <div className="text-destructive font-medium">
                      {gap.gap_value.toFixed(1)}{gap.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((gap.gap_value / gap.target_value) * 100).toFixed(1)}% shortfall
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      getPriorityLevel(gap.gap_value, gap.target_value) === 'High' ? 'destructive' :
                      getPriorityLevel(gap.gap_value, gap.target_value) === 'Medium' ? 'default' : 'secondary'
                    }>
                      {getPriorityLevel(gap.gap_value, gap.target_value)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm">
                      {getSuggestedFocus(gap)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateTask(gap)}
                      className="h-8"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Task
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredGaps.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No matching gaps found' : 'No performance gaps detected'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'All KPIs are currently meeting or exceeding their targets'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}