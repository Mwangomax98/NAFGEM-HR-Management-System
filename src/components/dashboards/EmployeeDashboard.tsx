import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WelcomeHeader } from "@/components/hr/WelcomeHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { Calendar, FileText, Car, User, MapPin, CheckSquare } from "lucide-react";

interface EmployeeDashboardProps {
  userName: string;
}

export function EmployeeDashboard({ userName }: EmployeeDashboardProps) {
  const { stats, pendingRequests, loading } = useDashboardData('employee');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <WelcomeHeader userName={userName} userRole="employee" />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/tasks')}>
          <CheckSquare className="h-4 w-4 mr-2" />
          My Tasks
        </Button>
        <Button variant="outline" onClick={() => navigate('/leave')}>
          <Calendar className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
        <Button variant="outline" onClick={() => navigate('/field-reports')}>
          <MapPin className="h-4 w-4 mr-2" />
          Field Report
        </Button>
        <Button variant="outline" onClick={() => navigate('/staff-requests')}>
          <FileText className="h-4 w-4 mr-2" />
          Staff Requests
        </Button>
        <Button variant="outline" onClick={() => navigate('/profile')}>
          <User className="h-4 w-4 mr-2" />
          Update Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.weeklyTasks}</div>
            <p className="text-xs text-muted-foreground mt-2">This week&apos;s sheets</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trip Requests</CardTitle>
            <Car className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.pendingTripRequests}</div>
            <p className="text-xs text-muted-foreground mt-2">Active / pending</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Total pending items</p>
          </CardContent>
        </Card>
      </div>

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
            </div>
          ) : (
            pendingRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{request.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
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
  );
}
