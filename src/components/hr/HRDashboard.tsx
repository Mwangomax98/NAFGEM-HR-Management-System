import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeHeader } from "./WelcomeHeader";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  AlertCircle,
  Car,
  BookOpen,
  Target,
  DollarSign
} from "lucide-react";

interface DashboardProps {
  userRole: "employee" | "hr" | "admin";
  userName: string;
}

export function HRDashboard({ userRole, userName }: DashboardProps) {
  const navigate = useNavigate();
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  // Clean slate - no demo data
  const employeeData = {
    tasksCompleted: 0,
    totalTasks: 0,
    hoursLogged: 0,
    pendingLeaves: 0,
    upcomingTrips: 0,
    performance: 0
  };

  const hrData = {
    totalEmployees: 0,
    pendingApprovals: 0,
    activeProjects: 0,
    thisMonthHires: 0,
    trainingProgress: 0,
    avgPerformance: 0
  };

  const adminData = {
    systemHealth: 100,
    totalUsers: 0,
    activeProjects: 0,
    monthlyExpenses: 0,
    completionRate: 0,
    satisfaction: 0
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const renderEmployeeDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <CheckSquare className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{employeeData.tasksCompleted}/{employeeData.totalTasks}</div>
            <Progress value={(employeeData.tasksCompleted / employeeData.totalTasks) * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((employeeData.tasksCompleted / employeeData.totalTasks) * 100)}% completed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours This Week</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{employeeData.hoursLogged}h</div>
            <p className="text-xs text-muted-foreground">
              +2.5h from last week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{employeeData.pendingLeaves}</div>
            <p className="text-xs text-muted-foreground">
              Pending approval
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{employeeData.performance}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest assignments and progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <p>No recent tasks yet. Tasks will appear here when assigned to you.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your schedule for the next few days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <p>No upcoming events. Your schedule will appear here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHRDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{hrData.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              +{hrData.thisMonthHires} new hires this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{hrData.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              Requires your attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{hrData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{hrData.avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">
              +3% from last quarter
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>Items requiring your immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <p>No pending approvals. Items requiring review will appear here.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Recent performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { metric: "Training Completion", value: hrData.trainingProgress, color: "bg-accent" },
              { metric: "Goal Achievement", value: 0, color: "bg-primary" },
              { metric: "Attendance Rate", value: 0, color: "bg-secondary" },
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{item.metric}</span>
                  <span className="text-sm text-muted-foreground">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{adminData.systemHealth}%</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{adminData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active user accounts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">TSh {(adminData.monthlyExpenses / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">
              Within budget limits
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-highlight">{adminData.satisfaction}/5</div>
            <p className="text-xs text-muted-foreground">
              Employee satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>System Analytics</CardTitle>
            <CardDescription>Key system performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { metric: "Server Uptime", value: 100, status: "Operational" },
              { metric: "Response Time", value: 100, status: "Good" },
              { metric: "Data Backup", value: 100, status: "Complete" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{item.metric}</p>
                  <p className="text-sm text-muted-foreground">{item.value}%</p>
                </div>
                <Badge variant={item.value > 98 ? "default" : item.value > 90 ? "secondary" : "destructive"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>System-wide activities and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground py-8">
              <p>No recent activities. System activities will be logged here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <WelcomeHeader userName={userName} userRole={userRole} />

      {/* Role-based Dashboard */}
      {userRole === "employee" && renderEmployeeDashboard()}
      {userRole === "hr" && renderHRDashboard()}
      {userRole === "admin" && renderAdminDashboard()}
    </div>
  );
}