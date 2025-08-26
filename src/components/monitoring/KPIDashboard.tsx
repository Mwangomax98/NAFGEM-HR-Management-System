import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface KPI {
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
  description?: string;
  latest_comment?: string;
  reporting_period?: string;
}

export function KPIDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadKPIs();
  }, [selectedProject, selectedTimeframe]);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      let query = supabase.from('kpi_gaps').select('*');
      
      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }
      
      if (selectedTimeframe !== 'all') {
        query = query.eq('timeframe', selectedTimeframe);
      }

      const { data, error } = await query;
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-accent text-accent-foreground';
      case 'slightly_off': return 'bg-yellow-500 text-white';
      case 'gap': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return <CheckCircle className="w-4 h-4" />;
      case 'slightly_off': return <AlertTriangle className="w-4 h-4" />;
      case 'gap': return <Target className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const calculateProgress = (actual: number, target: number) => {
    return Math.min((actual / target) * 100, 100);
  };

  // Chart data preparation
  const chartData = kpis.map(kpi => ({
    name: kpi.title.substring(0, 20) + (kpi.title.length > 20 ? '...' : ''),
    target: kpi.target_value,
    actual: kpi.actual_value,
    progress: calculateProgress(kpi.actual_value, kpi.target_value)
  }));

  const statusDistribution = [
    { name: 'On Track', value: kpis.filter(k => k.status === 'on_track').length, color: 'hsl(var(--accent))' },
    { name: 'Slightly Off', value: kpis.filter(k => k.status === 'slightly_off').length, color: '#eab308' },
    { name: 'Gap', value: kpis.filter(k => k.status === 'gap').length, color: 'hsl(var(--destructive))' }
  ];

  const summary = {
    total: kpis.length,
    onTrack: kpis.filter(k => k.status === 'on_track').length,
    slightlyOff: kpis.filter(k => k.status === 'slightly_off').length,
    gaps: kpis.filter(k => k.status === 'gap').length,
    avgProgress: kpis.length > 0 ? kpis.reduce((acc, kpi) => acc + calculateProgress(kpi.actual_value, kpi.target_value), 0) / kpis.length : 0
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {/* Add project options dynamically */}
          </SelectContent>
        </Select>
        
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Timeframes</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annually">Annually</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <CheckCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{summary.onTrack}</div>
            <p className="text-xs text-muted-foreground">
              {summary.total > 0 ? Math.round((summary.onTrack / summary.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.gaps}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(summary.avgProgress)}%</div>
            <Progress value={summary.avgProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Target vs Actual Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Target vs Actual Performance</CardTitle>
            <CardDescription>
              Comparison of target and actual values across KPIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                target: { label: "Target", color: "hsl(var(--primary))" },
                actual: { label: "Actual", color: "hsl(var(--accent))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="target" fill="hsl(var(--primary))" name="Target" />
                  <Bar dataKey="actual" fill="hsl(var(--accent))" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>
              Overview of KPI performance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                onTrack: { label: "On Track", color: "hsl(var(--accent))" },
                slightlyOff: { label: "Slightly Off", color: "#eab308" },
                gap: { label: "Gap", color: "hsl(var(--destructive))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.kpi_id} className="hover:shadow-card transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base line-clamp-2">{kpi.title}</CardTitle>
                <Badge className={getStatusColor(kpi.status)}>
                  {getStatusIcon(kpi.status)}
                  <span className="ml-1 capitalize">{kpi.status.replace('_', ' ')}</span>
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {kpi.project_id} • {kpi.category} • {kpi.timeframe}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">
                  {kpi.actual_value}{kpi.unit} / {kpi.target_value}{kpi.unit}
                </span>
              </div>
              <Progress 
                value={calculateProgress(kpi.actual_value, kpi.target_value)} 
                className="h-2"
              />
              {kpi.gap_value > 0 && (
                <div className="text-sm text-destructive">
                  Gap: {Math.abs(kpi.gap_value).toFixed(1)}{kpi.unit}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {kpis.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No KPIs Found</h3>
            <p className="text-muted-foreground">
              No KPIs are currently defined for your projects. Contact HR to set up performance indicators.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}