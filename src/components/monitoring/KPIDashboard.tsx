import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Activity, BarChart3, Calendar, Filter, RefreshCw, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, RadialBarChart, RadialBar } from "recharts";

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
      {/* Enhanced Header with Actions */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-sm border border-primary/20">
        <div>
          <h2 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            KPI Performance Dashboard
          </h2>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of key performance indicators across all projects
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadKPIs} className="hover:bg-primary/10">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="hover:bg-accent/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Smart Filters */}
      <Card className="overflow-hidden bg-gradient-to-r from-card via-card/95 to-card shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5 text-primary" />
            Smart Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {/* Add project options dynamically */}
              </SelectContent>
            </Select>
            
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-48 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="Filter by timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-elevated transition-all duration-300 interactive-lift border-primary/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total KPIs</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{summary.total}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Activity className="w-3 h-3" />
              Across all projects
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 hover:shadow-elevated transition-all duration-300 interactive-lift border-accent/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-accent">On Track</CardTitle>
            <div className="p-2 bg-accent/10 rounded-full">
              <CheckCircle className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{summary.onTrack}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {summary.total > 0 ? Math.round((summary.onTrack / summary.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-destructive/5 to-destructive/10 hover:shadow-elevated transition-all duration-300 interactive-lift border-destructive/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-destructive/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Critical Gaps</CardTitle>
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{summary.gaps}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />
              Require immediate action
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-elevated transition-all duration-300 interactive-lift border-secondary/20">
          <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/10 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-secondary">Overall Progress</CardTitle>
            <div className="p-2 bg-secondary/10 rounded-full">
              <BarChart3 className="h-4 w-4 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{Math.round(summary.avgProgress)}%</div>
            <Progress value={summary.avgProgress} className="mt-2 bg-secondary/20" />
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Multi-Chart Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Performance Trends */}
        <Card className="lg:col-span-2 xl:col-span-2 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Target vs actual performance with trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                target: { label: "Target", color: "hsl(var(--primary))" },
                actual: { label: "Actual", color: "hsl(var(--accent))" }
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="target" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#targetGradient)" />
                  <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#actualGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Radial */}
        <Card className="overflow-hidden bg-gradient-to-br from-accent/5 to-destructive/5 border-accent/20">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-destructive/10">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Status Overview
            </CardTitle>
            <CardDescription>
              Performance status breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                onTrack: { label: "On Track", color: "hsl(var(--accent))" },
                slightlyOff: { label: "Slightly Off", color: "#eab308" },
                gap: { label: "Gap", color: "hsl(var(--destructive))" }
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={statusDistribution}>
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill="#8884d8"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance Comparison Bar Chart */}
        <Card className="lg:col-span-2 xl:col-span-3 overflow-hidden bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
          <CardHeader className="bg-gradient-to-r from-secondary/10 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-secondary" />
              Detailed Performance Analysis
            </CardTitle>
            <CardDescription>
              Comprehensive view of all KPI targets and achievements
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer
              config={{
                target: { label: "Target", color: "hsl(var(--secondary))" },
                actual: { label: "Actual", color: "hsl(var(--accent))" },
                progress: { label: "Progress %", color: "hsl(var(--primary))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="target" fill="hsl(var(--secondary))" name="Target" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="hsl(var(--accent))" name="Actual" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold text-foreground">Individual KPI Performance</h3>
          <Button variant="outline" size="sm" className="hover:bg-primary/10">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {kpis.map((kpi) => (
            <Card key={kpi.kpi_id} className="relative overflow-hidden group hover:shadow-elevated transition-all duration-300 interactive-lift bg-gradient-to-br from-card via-card/95 to-card/90 border-primary/10 hover:border-primary/30">
              {/* Status Indicator Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                kpi.status === 'on_track' ? 'bg-accent' :
                kpi.status === 'slightly_off' ? 'bg-yellow-500' :
                'bg-destructive'
              }`}></div>
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {kpi.title}
                  </CardTitle>
                  <Badge className={`${getStatusColor(kpi.status)} shrink-0`}>
                    {getStatusIcon(kpi.status)}
                    <span className="ml-1 capitalize">{kpi.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <CardDescription className="text-sm flex items-center gap-2">
                  <span className="font-medium text-primary">{kpi.project_id}</span>
                  <span>•</span>
                  <span className="capitalize">{kpi.category}</span>
                  <span>•</span>
                  <span className="capitalize">{kpi.timeframe}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Achievement</span>
                    <span className="text-lg font-bold">
                      <span className="text-accent">{kpi.actual_value}{kpi.unit}</span>
                      <span className="text-muted-foreground text-sm"> / {kpi.target_value}{kpi.unit}</span>
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={calculateProgress(kpi.actual_value, kpi.target_value)} 
                      className="h-3 bg-muted/50"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span className="font-medium text-primary">
                        {Math.round(calculateProgress(kpi.actual_value, kpi.target_value))}%
                      </span>
                      <span>{kpi.target_value}{kpi.unit}</span>
                    </div>
                  </div>
                </div>
                
                {kpi.gap_value > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        Gap: {Math.abs(kpi.gap_value).toFixed(1)}{kpi.unit}
                      </span>
                    </div>
                    <p className="text-xs text-destructive/80 mt-1">
                      {((kpi.gap_value / kpi.target_value) * 100).toFixed(1)}% shortfall from target
                    </p>
                  </div>
                )}

                {kpi.latest_comment && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-xs text-muted-foreground italic">
                      "{kpi.latest_comment}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
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