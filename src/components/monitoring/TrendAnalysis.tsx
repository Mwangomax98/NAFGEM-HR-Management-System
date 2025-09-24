import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent 
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from "recharts";

interface TrendData {
  period: string;
  target: number;
  actual: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface KPITrend {
  kpi_id: string;
  title: string;
  project_id: string;
  trends: TrendData[];
  overall_trend: 'improving' | 'declining' | 'stable';
  trend_percentage: number;
}

export function TrendAnalysis() {
  const [trends, setTrends] = useState<KPITrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedKPI, setSelectedKPI] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadTrends();
  }, [selectedPeriod, selectedKPI]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      // Real trend data would come from Supabase analytics
      // For now, we start with empty data
      setTrends([]);
    } catch (error) {
      console.error('Error loading trends:', error);
      toast({
        title: "Error",
        description: "Failed to load trend analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-accent" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-accent';
      case 'declining': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const allTrendData = trends.flatMap(kpi => 
    kpi.trends.map(trend => ({
      ...trend,
      kpi_title: kpi.title
    }))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 p-6 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 backdrop-blur-sm border border-primary/20">
        <div>
          <h2 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Performance Trend Analysis
          </h2>
          <p className="text-muted-foreground mt-2">
            Track performance patterns and identify trends across time periods
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Trend Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trends.map((kpi) => (
          <Card key={kpi.kpi_id} className="relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 hover:shadow-elevated transition-all duration-300 interactive-lift">
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              kpi.overall_trend === 'improving' ? 'bg-accent' :
              kpi.overall_trend === 'declining' ? 'bg-destructive' :
              'bg-muted'
            }`}></div>
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{kpi.title}</CardTitle>
                <div className="flex items-center gap-1">
                  {getTrendIcon(kpi.overall_trend)}
                  <span className={`text-sm font-medium ${getTrendColor(kpi.overall_trend)}`}>
                    {Math.abs(kpi.trend_percentage)}%
                  </span>
                </div>
              </div>
              <CardDescription>{kpi.project_id}</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpi.trends}>
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke={
                        kpi.overall_trend === 'improving' ? 'hsl(var(--accent))' :
                        kpi.overall_trend === 'declining' ? 'hsl(var(--destructive))' :
                        'hsl(var(--muted-foreground))'
                      }
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-3 p-2 rounded bg-muted/50">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Trend Status:</span>
                  <span className={`font-medium capitalize ${getTrendColor(kpi.overall_trend)}`}>
                    {kpi.overall_trend}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Trend Chart */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comprehensive Trend Analysis
          </CardTitle>
          <CardDescription>
            Detailed performance trends across all KPIs with target comparisons
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {trends.length > 0 && (
            <ChartContainer
              config={{
                target: { label: "Target", color: "hsl(var(--primary))" },
                actual: { label: "Actual", color: "hsl(var(--accent))" }
              }}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends[0].trends}>
                  <defs>
                    <linearGradient id="targetTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="actualTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="target" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#targetTrend)" />
                  <Area type="monotone" dataKey="actual" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#actualTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Trend Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            Trend Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trends.map((kpi) => (
              <div key={kpi.kpi_id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-medium text-foreground">{kpi.title}</h4>
                    <p className="text-sm text-muted-foreground">{kpi.project_id}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(kpi.overall_trend)}
                      <span className={`text-sm font-medium ${getTrendColor(kpi.overall_trend)}`}>
                        {kpi.overall_trend === 'improving' ? '+' : kpi.overall_trend === 'declining' ? '-' : ''}
                        {Math.abs(kpi.trend_percentage)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">vs last period</p>
                  </div>
                </div>
                
                <div className="mt-3 p-3 rounded bg-card border border-border/30">
                  <p className="text-sm">
                    {kpi.overall_trend === 'improving' && (
                      <span className="text-accent font-medium">Positive trend detected. </span>
                    )}
                    {kpi.overall_trend === 'declining' && (
                      <span className="text-destructive font-medium">Declining performance. </span>
                    )}
                    {kpi.overall_trend === 'stable' && (
                      <span className="text-muted-foreground font-medium">Stable performance. </span>
                    )}
                    Monitor key factors and maintain current strategies.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}