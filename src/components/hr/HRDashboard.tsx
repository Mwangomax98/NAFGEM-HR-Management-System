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

  // Mock data - in real app, this would come from API
  const employeeData = {
    tasksCompleted: 12,
    totalTasks: 15,
    hoursLogged: 38.5,
    pendingLeaves: 1,
    upcomingTrips: 2,
    performance: 85
  };

  const hrData = {
    totalEmployees: 124,
    pendingApprovals: 8,
    activeProjects: 12,
    thisMonthHires: 3,
    trainingProgress: 78,
    avgPerformance: 87
  };

  const adminData = {
    systemHealth: 98,
    totalUsers: 156,
    activeProjects: 15,
    monthlyExpenses: 125000,
    completionRate: 92,
    satisfaction: 4.8
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
            {[
              { task: "Complete Q4 Project Report", status: "In Progress", priority: "High" },
              { task: "Attend Team Training Session", status: "Completed", priority: "Medium" },
              { task: "Submit Expense Reports", status: "Pending", priority: "Low" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{item.task}</p>
                  <p className="text-sm text-muted-foreground">{item.status}</p>
                </div>
                <Badge variant={item.priority === "High" ? "destructive" : item.priority === "Medium" ? "default" : "secondary"}>
                  {item.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your schedule for the next few days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { event: "Team Meeting", date: "Tomorrow 10:00 AM", type: "Meeting" },
              { event: "Project Deadline", date: "Dec 15, 2024", type: "Deadline" },
              { event: "Training Session", date: "Dec 18, 2024", type: "Training" },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div>
                  <p className="font-medium">{item.event}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant="outline">{item.type}</Badge>
              </div>
            ))}
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
            {[
              { type: "Leave Request", employee: "John Smith", status: "Pending", urgent: true },
              { type: "Timesheet", employee: "Sarah Wilson", status: "Review", urgent: false },
              { type: "Trip Request", employee: "Mike Johnson", status: "Pending", urgent: true },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{item.type} - {item.employee}</p>
                  <p className="text-sm text-muted-foreground">{item.status}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {item.urgent && <Badge variant="destructive">Urgent</Badge>}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      if (item.type === "Leave Request") navigate("/hr/leave-approvals");
                      else if (item.type === "Timesheet") navigate("/hr/timesheet-approvals");
                      else if (item.type === "Trip Request") navigate("/hr/trip-management");
                    }}
                  >
                    Review
                  </Button>
                </div>
              </div>
            ))}
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
              { metric: "Goal Achievement", value: 89, color: "bg-primary" },
              { metric: "Attendance Rate", value: 96, color: "bg-secondary" },
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
            <div className="text-2xl font-bold font-highlight">${(adminData.monthlyExpenses / 1000).toFixed(0)}K</div>
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
              { metric: "Server Uptime", value: 99.9, status: "Excellent" },
              { metric: "Response Time", value: 95, status: "Good" },
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
            {[
              { activity: "System Backup Completed", time: "2 hours ago", type: "System" },
              { activity: "New User Registration", time: "4 hours ago", type: "User" },
              { activity: "Security Update Applied", time: "1 day ago", type: "Security" },
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div>
                  <p className="font-medium">{item.activity}</p>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
                <Badge variant="outline">{item.type}</Badge>
              </div>
            ))}
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