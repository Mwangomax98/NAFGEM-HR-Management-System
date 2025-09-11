import { EmployeeDashboard } from "@/components/dashboards/EmployeeDashboard";
import { HRDashboard as HRDashboardComponent } from "@/components/dashboards/HRDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";

interface DashboardProps {
  userRole: "employee" | "hr" | "admin";
  userName: string;
}

export function HRDashboard({ userRole, userName }: DashboardProps) {
  // Route to appropriate role-specific dashboard
  if (userRole === "employee") {
    return <EmployeeDashboard userName={userName} />;
  }
  
  if (userRole === "hr") {
    return <HRDashboardComponent userName={userName} />;
  }
  
  if (userRole === "admin") {
    return <AdminDashboard userName={userName} />;
  }

  // Fallback for unknown roles
  return <EmployeeDashboard userName={userName} />;
}