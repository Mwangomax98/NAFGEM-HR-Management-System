import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Server, 
  DollarSign, 
  Star,
  Settings,
  UserCog,
  BarChart3,
  Shield,
  Database,
  Activity,
  Zap,
  TrendingUp
} from "lucide-react";

interface AdminDashboardProps {
  userName: string;
}

export function AdminDashboard({ userName }: AdminDashboardProps) {
  const { stats, loading } = useDashboardData('admin');
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const systemMetrics = [
    { name: "Server Uptime", value: 99.9, status: "Excellent", icon: Server },
    { name: "Response Time", value: 95, status: "Good", icon: Zap },
    { name: "Data Backup", value: 100, status: "Complete", icon: Database },
    { name: "Security Score", value: 98, status: "Secure", icon: Shield }
  ];

  const recentActivities = [
    { action: "User Role Updated", user: "john.doe@nafgem.com", time: "2 min ago", type: "security" },
    { action: "New Employee Added", user: "hr.manager@nafgem.com", time: "15 min ago", type: "user" },
    { action: "System Backup Complete", user: "System", time: "1 hour ago", type: "system" },
    { action: "Performance Report Generated", user: "admin@nafgem.com", time: "2 hours ago", type: "report" }
  ];

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
      <div className="bg-gradient-hero rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">{getGreeting()}, {userName}!</h1>
        <p className="text-white/90 mt-1">
          Monitor system health, manage users, and oversee organizational performance.
        </p>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => navigate('/admin/user-management')}
          className="bg-gradient-button hover:shadow-accent-glow transition-all"
        >
          <UserCog className="h-4 w-4 mr-2" />
          Manage Users
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/admin/system-settings')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/reports')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/monitoring-evaluation')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          KPI Dashboard
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.systemHealth}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active user accounts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              TSh {(stats.monthlyBudget / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Within budget limits
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.userSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground mt-2">
              Average rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Monitor */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-primary" />
              <span>System Health Monitor</span>
            </CardTitle>
            <CardDescription>Real-time system performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">{metric.value}%</p>
                    </div>
                  </div>
                  <Badge 
                    variant={metric.value > 95 ? "default" : metric.value > 85 ? "secondary" : "destructive"}
                    className="ml-4"
                  >
                    {metric.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Organizational Analytics */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              <span>Organizational Analytics</span>
            </CardTitle>
            <CardDescription>Key performance indicators across the organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { 
                metric: "Employee Productivity", 
                value: 87, 
                target: 85,
                trend: "+5%",
                color: "bg-accent" 
              },
              { 
                metric: "System Utilization", 
                value: 92, 
                target: 90,
                trend: "+2%",
                color: "bg-primary" 
              },
              { 
                metric: "Budget Efficiency", 
                value: 95, 
                target: 90,
                trend: "+8%",
                color: "bg-secondary" 
              },
              { 
                metric: "Data Security Score", 
                value: 98, 
                target: 95,
                trend: "stable",
                color: "bg-success" 
              }
            ].map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.metric}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{item.value}%</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.trend}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={item.value} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target: {item.target}%</span>
                    <span className={item.value >= item.target ? "text-success" : "text-warning"}>
                      {item.value >= item.target ? "Exceeding Target" : "Below Target"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Audit Trail */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-accent" />
            <span>Recent System Activities</span>
          </CardTitle>
          <CardDescription>System-wide activities and security events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'security' ? 'bg-destructive' :
                    activity.type === 'user' ? 'bg-primary' :
                    activity.type === 'system' ? 'bg-success' : 'bg-secondary'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => navigate('/admin/audit-logs')}
          >
            View Full Audit Trail
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}