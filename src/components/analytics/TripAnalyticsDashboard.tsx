import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Car, 
  User, 
  MapPin, 
  Clock,
  DollarSign,
  BarChart3,
  Download
} from 'lucide-react';
import { supabase } from "@/lib/api";
import { toast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface AnalyticsData {
  totalTrips: number;
  completedTrips: number;
  pendingTrips: number;
  completionRate: number;
  averageTripDuration: number;
  totalDrivers: number;
  activeDrivers: number;
  totalVehicles: number;
  activeVehicles: number;
  utilizationRate: number;
}

interface TrendData {
  date: string;
  trips: number;
  completed: number;
  pending: number;
}

interface ProjectData {
  project: string;
  trips: number;
  percentage: number;
}

interface DriverPerformance {
  name: string;
  trips: number;
  hours: number;
  rating: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export function TripAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedProject]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = getStartDate(dateRange);

      // Fetch basic analytics
      const analyticsData = await fetchBasicAnalytics(startDate, endDate);
      setAnalytics(analyticsData);

      // Fetch trend data
      const trends = await fetchTrendData(startDate, endDate);
      setTrendData(trends);

      // Fetch project breakdown
      const projects = await fetchProjectData(startDate, endDate);
      setProjectData(projects);

      // Fetch driver performance
      const driverStats = await fetchDriverPerformance(startDate, endDate);
      setDriverPerformance(driverStats);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = (range: string): Date => {
    const now = new Date();
    switch (range) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '90d': return subDays(now, 90);
      case '1y': return subDays(now, 365);
      default: return subDays(now, 30);
    }
  };

  const fetchBasicAnalytics = async (startDate: Date, endDate: Date): Promise<AnalyticsData> => {
    let tripsQuery = supabase
      .from('trip_requests')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (selectedProject !== 'all') {
      tripsQuery = tripsQuery.eq('project_id', selectedProject);
    }

    const [
      { data: trips },
      { data: drivers },
      { data: vehicles }
    ] = await Promise.all([
      tripsQuery,
      supabase.from('drivers').select('*'),
      supabase.from('vehicles').select('*')
    ]);

    const totalTrips = trips?.length || 0;
    const completedTrips = trips?.filter(t => t.status === 'completed').length || 0;
    const pendingTrips = trips?.filter(t => t.status === 'pending').length || 0;
    const completionRate = totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0;

    // Calculate average trip duration
    const completedTripsWithDuration = trips?.filter(t => 
      t.status === 'completed' && t.start_datetime && t.end_datetime
    ) || [];
    
    const totalDuration = completedTripsWithDuration.reduce((sum, trip) => {
      const start = new Date(trip.start_datetime);
      const end = new Date(trip.end_datetime);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    const averageTripDuration = completedTripsWithDuration.length > 0 
      ? totalDuration / (completedTripsWithDuration.length * 1000 * 60 * 60) // Convert to hours
      : 0;

    const totalDrivers = drivers?.length || 0;
    const activeDrivers = drivers?.filter(d => d.status === 'available').length || 0;
    const totalVehicles = vehicles?.length || 0;
    const activeVehicles = vehicles?.filter(v => v.status === 'available').length || 0;

    // Calculate utilization rate (simplified)
    const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

    return {
      totalTrips,
      completedTrips,
      pendingTrips,
      completionRate,
      averageTripDuration,
      totalDrivers,
      activeDrivers,
      totalVehicles,
      activeVehicles,
      utilizationRate
    };
  };

  const fetchTrendData = async (startDate: Date, endDate: Date): Promise<TrendData[]> => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const trendData: TrendData[] = [];

    for (const day of days) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      let query = supabase
        .from('trip_requests')
        .select('status')
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      if (selectedProject !== 'all') {
        query = query.eq('project_id', selectedProject);
      }

      const { data: dayTrips } = await query;

      const trips = dayTrips?.length || 0;
      const completed = dayTrips?.filter(t => t.status === 'completed').length || 0;
      const pending = dayTrips?.filter(t => t.status === 'pending').length || 0;

      trendData.push({
        date: format(day, 'MM/dd'),
        trips,
        completed,
        pending
      });
    }

    return trendData;
  };

  const fetchProjectData = async (startDate: Date, endDate: Date): Promise<ProjectData[]> => {
    let query = supabase
      .from('trip_requests')
      .select('project_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: trips } = await query;

    if (!trips) return [];

    const projectCounts = trips.reduce((acc, trip) => {
      const project = trip.project_id || 'Unknown';
      acc[project] = (acc[project] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = trips.length;
    
    return Object.entries(projectCounts).map(([project, count]) => ({
      project,
      trips: count,
      percentage: (count / total) * 100
    }));
  };

  const fetchDriverPerformance = async (startDate: Date, endDate: Date): Promise<DriverPerformance[]> => {
    const { data: drivers } = await supabase
      .from('drivers')
      .select('id, name');

    if (!drivers?.length) return [];

    const { data: trips } = await supabase
      .from('trip_requests')
      .select('id, assigned_driver_id, start_datetime, end_datetime, status')
      .gte('start_datetime', startDate.toISOString())
      .lte('start_datetime', endDate.toISOString())
      .not('assigned_driver_id', 'is', null);

    const tripsByDriver: Record<string, any[]> = {};
    for (const trip of trips || []) {
      if (!trip.assigned_driver_id) continue;
      if (!tripsByDriver[trip.assigned_driver_id]) tripsByDriver[trip.assigned_driver_id] = [];
      tripsByDriver[trip.assigned_driver_id].push(trip);
    }

    return drivers.map(driver => {
      const driverTrips = tripsByDriver[driver.id] || [];

      const totalHours = driverTrips.reduce((sum, trip) => {
        if (trip.start_datetime && trip.end_datetime) {
          const start = new Date(trip.start_datetime);
          const end = new Date(trip.end_datetime);
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }
        return sum;
      }, 0);

      const completedTrips = driverTrips.filter(t => t.status === 'completed').length;
      const rating = driverTrips.length > 0 ? (completedTrips / driverTrips.length) * 5 : 0;

      return {
        name: driver.name,
        trips: driverTrips.length,
        hours: Math.round(totalHours * 10) / 10,
        rating: Math.round(rating * 10) / 10
      };
    }).filter(driver => driver.trips > 0);
  };

  const exportData = () => {
    // Simple CSV export functionality
    const csvData = [
      ['Metric', 'Value'],
      ['Total Trips', analytics?.totalTrips.toString() || '0'],
      ['Completed Trips', analytics?.completedTrips.toString() || '0'],
      ['Completion Rate', `${analytics?.completionRate.toFixed(1)}%` || '0%'],
      ['Average Trip Duration', `${analytics?.averageTripDuration.toFixed(1)} hours` || '0 hours'],
      ['Active Drivers', `${analytics?.activeDrivers}/${analytics?.totalDrivers}` || '0/0'],
      ['Active Vehicles', `${analytics?.activeVehicles}/${analytics?.totalVehicles}` || '0/0']
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trip-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trip Analytics Dashboard
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select value={dateRange} onValueChange={(value: '7d' | '30d' | '90d' | '1y') => setDateRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectData.map(project => (
                    <SelectItem key={project.project} value={project.project}>
                      {project.project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold">{analytics?.totalTrips}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="secondary">
                {analytics?.completionRate.toFixed(1)}% completion rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">{analytics?.activeDrivers}/{analytics?.totalDrivers}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline">
                {analytics && analytics.totalDrivers > 0 
                  ? ((analytics.activeDrivers / analytics.totalDrivers) * 100).toFixed(1)
                  : 0}% active
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <p className="text-2xl font-bold">{analytics?.activeVehicles}/{analytics?.totalVehicles}</p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="outline">
                {analytics?.utilizationRate.toFixed(1)}% utilization
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Trip Duration</p>
                <p className="text-2xl font-bold">{analytics?.averageTripDuration.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center mt-2">
              <Badge variant="secondary">Per trip</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="performance">Driver Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Trip Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="trips" stroke="hsl(var(--primary))" name="Total Trips" />
                  <Line type="monotone" dataKey="completed" stroke="hsl(var(--secondary))" name="Completed" />
                  <Line type="monotone" dataKey="pending" stroke="hsl(var(--accent))" name="Pending" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trip Distribution by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ project, percentage }) => `${project} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="trips"
                    >
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projectData.map((project, index) => (
                    <div key={project.project} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{project.project}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{project.trips} trips</div>
                        <div className="text-sm text-muted-foreground">{project.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={driverPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="trips" fill="hsl(var(--primary))" name="Trips" />
                  <Bar dataKey="hours" fill="hsl(var(--secondary))" name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}