import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "@/lib/i18n";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Tasks from "./pages/Tasks";
import Leave from "./pages/Leave";
import Trips from "./pages/Trips";
import MyTraining from "./pages/MyTraining";
import FieldReports from "./pages/FieldReports";
import StaffRequests from "./pages/StaffRequests";
import EmployeeManagement from "./pages/hr/EmployeeManagement";
import ProjectManagement from "./pages/hr/ProjectManagement";
import LeaveApprovals from "./pages/hr/LeaveApprovals";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import TripManagement from "./pages/hr/TripManagement";
import Performance from "./pages/hr/Performance";
import Notifications from "./pages/Notifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HRLayout, DashboardPage } from "@/components/hr/HRLayout";
import { ROLES } from "@/lib/roles";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            <Route
              element={
                <ProtectedRoute requiredRole={ROLES.EMPLOYEE}>
                  <HRLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="leave" element={<Leave />} />
              <Route path="trips" element={<Trips />} />
              <Route path="staff-requests" element={<StaffRequests />} />
              <Route path="training" element={<MyTraining />} />
              <Route path="notifications" element={<Notifications />} />

              <Route
                path="field-reports"
                element={
                  <ProtectedRoute requiredRole={ROLES.FIELD_OFFICER}>
                    <FieldReports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="hr/employee-management"
                element={
                  <ProtectedRoute requiredRole={ROLES.HR_ADMIN}>
                    <EmployeeManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/projects"
                element={
                  <ProtectedRoute requiredRole={ROLES.HR_ADMIN}>
                    <ProjectManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/training"
                element={
                  <ProtectedRoute requiredRole={ROLES.HR_ADMIN}>
                    <MyTraining />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/field-reports"
                element={
                  <ProtectedRoute requiredRole={ROLES.HR_ADMIN}>
                    <FieldReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/leave-approvals"
                element={
                  <ProtectedRoute requiredRole={ROLES.HR_ADMIN}>
                    <LeaveApprovals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/trip-management"
                element={
                  <ProtectedRoute requiredRole={ROLES.HR_ADMIN}>
                    <TripManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/performance"
                element={
                  <ProtectedRoute requiredRole={ROLES.MANAGER}>
                    <Performance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute requiredRole={ROLES.SUPER_ADMIN}>
                    <SystemSettings />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
