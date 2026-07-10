import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WelcomeHeader } from "@/components/hr/WelcomeHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Settings,
  UserCog,
  Building2,
  Calendar,
  MapPin,
  Award,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

interface AdminDashboardProps {
  userName: string;
}

export function AdminDashboard({ userName }: AdminDashboardProps) {
  const { stats, expiringCerts, loading } = useDashboardData('super_admin');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <WelcomeHeader userName={userName} userRole="super_admin" />

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/admin/users')}>
          <UserCog className="h-4 w-4 mr-2" />
          Manage Users
        </Button>
        <Button variant="outline" onClick={() => navigate('/hr/field-reports')}>
          <MapPin className="h-4 w-4 mr-2" />
          View Field Reports
        </Button>
        <Button variant="outline" onClick={() => navigate('/hr/projects')}>
          <Building2 className="h-4 w-4 mr-2" />
          Active Projects
        </Button>
        <Button variant="outline" onClick={() => navigate('/hr/training')}>
          <Award className="h-4 w-4 mr-2" />
          Training Records
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/settings')}>
          <Settings className="h-4 w-4 mr-2" />
          System Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground mt-1">Active profiles</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Donor Projects</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">Status: active</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leave</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Field Reports</CardTitle>
            <MapPin className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.fieldReportsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-accent/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certs Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.certsExpiringSoon}</div>
            <p className="text-xs text-muted-foreground mt-1">Within 60 days</p>
          </CardContent>
        </Card>
      </div>

      {expiringCerts.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" />
              Certification Expiry Alerts
            </CardTitle>
            <CardDescription>Certificates expiring within the next 60 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {expiringCerts.map((cert) => (
                <li key={cert.id} className="flex justify-between items-center border rounded-lg p-3 text-sm">
                  <span className="font-medium">{cert.certificate_name}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(cert.expiry_date), 'dd MMM yyyy')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
