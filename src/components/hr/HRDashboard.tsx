import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";
import { HRDashboard as HRDashboardComponent } from "@/components/dashboards/HRDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { isAdmin, isHrOrAbove, normalizeRole } from "@/lib/roles";

interface DashboardProps {
  userRole: string;
  userName: string;
}

export function HRDashboard({ userRole, userName }: DashboardProps) {
  const role = normalizeRole(userRole);

  if (isAdmin(role)) {
    return <AdminDashboard userName={userName} />;
  }

  if (isHrOrAbove(role)) {
    return <HRDashboardComponent userName={userName} />;
  }

  return <EmployeeDashboard userName={userName} />;
}
