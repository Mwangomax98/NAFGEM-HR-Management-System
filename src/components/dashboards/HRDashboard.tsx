import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeHeader } from "@/components/hr/WelcomeHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  AlertCircle, 
  Target, 
  TrendingUp,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  UserPlus
} from "lucide-react";

interface HRDashboardProps {
  userName: string;
}

export function HRDashboard({ userName }: HRDashboardProps) {
  const { stats, pendingRequests, loading } = useDashboardData('hr');
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleApprovalAction = (requestId: string, type: string, action: 'approve' | 'reject') => {
    // Navigate to appropriate approval page based on type
    if (type === 'leave') {
      navigate('/hr/leave-approvals');
    } else if (type === 'trip') {
      navigate('/hr/trip-management');
    } else if (type === 'timesheet') {
      navigate('/hr/timesheet-approvals');
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
      <WelcomeHeader userName={userName} userRole="hr" />

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => navigate('/hr/employee-management')}
          className="bg-gradient-button hover:shadow-accent-glow transition-all"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/hr/leave-approvals')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Review Leave Requests
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/hr/performance')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Performance Reviews
        </Button>
        <Button 
          variant="outline"
          onClick={() => navigate('/reports')}
          className="hover:bg-accent/5 hover:border-accent transition-all"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate Reports
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Requires your attention
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elevated transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.avgPerformance}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              Average completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Queue */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Approval Queue
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            </CardTitle>
            <CardDescription>Items requiring your immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending approvals.</p>
                <p className="text-xs mt-1">Items requiring review will appear here.</p>
              </div>
            ) : (
              pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {request.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{request.title}</h4>
                      {request.requester_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested by: {request.requester_name}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(request.id, request.type, 'approve')}
                        className="text-xs hover:bg-success/10 hover:border-success"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(request.id, request.type, 'reject')}
                        className="text-xs hover:bg-destructive/10 hover:border-destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {pendingRequests.length > 5 && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/hr/leave-approvals')}
              >
                View All Approvals ({pendingRequests.length})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Team Performance Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Team Performance Overview</CardTitle>
            <CardDescription>Key metrics across your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { 
                metric: "Task Completion Rate", 
                value: stats.avgPerformance, 
                target: 90,
                color: "bg-accent" 
              },
              { 
                metric: "Attendance Rate", 
                value: 95, 
                target: 95,
                color: "bg-primary" 
              },
              { 
                metric: "Goal Achievement", 
                value: 87, 
                target: 85,
                color: "bg-secondary" 
              },
              { 
                metric: "Training Completion", 
                value: 78, 
                target: 80,
                color: "bg-warning" 
              }
            ].map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.metric}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold">{item.value}%</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      / {item.target}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={item.value} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current</span>
                    <span className={item.value >= item.target ? "text-success" : "text-warning"}>
                      {item.value >= item.target ? "On Target" : "Needs Attention"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Team Activity</CardTitle>
          <CardDescription>Latest updates from your team members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity.</p>
            <p className="text-xs mt-1">Team activities and updates will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}