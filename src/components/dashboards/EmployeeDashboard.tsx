import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeHeader } from "@/components/hr/WelcomeHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Plus,
  FileText,
  Car,
  User
} from "lucide-react";

interface EmployeeDashboardProps {
  userName: string;
}

export function EmployeeDashboard({ userName }: EmployeeDashboardProps) {
  const { stats, todaysTasks, pendingRequests, loading } = useDashboardData('employee');
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'not_started': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader userName={userName} userRole="employee" />

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => navigate('/timesheets')}
          className="bg-gradient-button hover:shadow-accent-glow transition-all"
        >
          <FileText className="h-4 w-4 mr-2" />
          Submit Timesheet
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/leave')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/trips')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <Car className="h-4 w-4 mr-2" />
          Request Trip
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/profile')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <User className="h-4 w-4 mr-2" />
          Update Profile
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.completedTasks}/{stats.totalTasks}</div>
            <Progress 
              value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0} 
              className="mt-3" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.weeklyHours}h</div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: 40 hours
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Calendar className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.performance}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              This week's completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Today's Tasks
              <Badge variant="secondary">{todaysTasks.length}</Badge>
            </CardTitle>
            <CardDescription>Focus on these priorities to maximize your impact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysTasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks assigned yet.</p>
                <p className="text-xs mt-1">New tasks will appear here when assigned.</p>
              </div>
            ) : (
              todaysTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{task.completion_percentage}%</span>
                          </div>
                          <Progress value={task.completion_percentage} className="h-2" />
                        </div>
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={getStatusColor(task.status)} className="ml-4">
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Requests
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Track your submissions and their approval status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending requests.</p>
                <p className="text-xs mt-1">Your submitted requests will appear here.</p>
              </div>
            ) : (
              pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      request.status === 'approved' ? 'bg-success' : 
                      request.status === 'rejected' ? 'bg-destructive' : 'bg-warning'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{request.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={request.status === 'pending' ? 'warning' : 'secondary'}>
                    {request.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}