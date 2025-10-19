import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "@/lib/i18n";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Timesheets from "./pages/Timesheets";
import Tasks from "./pages/Tasks";
import Leave from "./pages/Leave";
import Trips from "./pages/Trips";
import Exit from "./pages/Exit";
import Auth from "./pages/Auth";
import EmployeeManagement from "./pages/hr/EmployeeManagement";
import HRManagement from "./pages/hr/HRManagement";
import ProjectManagement from "./pages/hr/ProjectManagement";
import TimesheetApprovals from "./pages/hr/TimesheetApprovals";
import LeaveApprovals from "./pages/hr/LeaveApprovals";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import TripManagement from "./pages/hr/TripManagement";
import Performance from "./pages/hr/Performance";

import Communications from "./pages/Communications";

import Notifications from "./pages/Notifications";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Profile /></ProtectedRoute>} />
          <Route path="/timesheets" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Timesheets /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Tasks /></ProtectedRoute>} />
          <Route path="/leave" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Leave /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Trips /></ProtectedRoute>} />
          <Route path="/exit" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Exit /></ProtectedRoute>} />
          <Route path="/hr/management" element={<ProtectedRoute requiredRole={ROLES.HR}><HRManagement /></ProtectedRoute>} />
          <Route path="/hr/employee-management" element={<ProtectedRoute requiredRole={ROLES.HR}><EmployeeManagement /></ProtectedRoute>} />
          <Route path="/hr/projects" element={<ProtectedRoute requiredRole={ROLES.HR}><ProjectManagement /></ProtectedRoute>} />
          <Route path="/hr/timesheet-approvals" element={<ProtectedRoute requiredRole={ROLES.HR}><TimesheetApprovals /></ProtectedRoute>} />
          <Route path="/hr/leave-approvals" element={<ProtectedRoute requiredRole={ROLES.HR}><LeaveApprovals /></ProtectedRoute>} />
          <Route path="/hr/trip-management" element={<ProtectedRoute requiredRole={ROLES.HR}><TripManagement /></ProtectedRoute>} />
          <Route path="/hr/performance" element={<ProtectedRoute requiredRole={ROLES.HR}><Performance /></ProtectedRoute>} />
          
          <Route path="/communications" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Communications /></ProtectedRoute>} />
          
          <Route path="/notifications" element={<ProtectedRoute requiredRole={ROLES.EMPLOYEE}><Notifications /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole={ROLES.ADMIN}><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredRole={ROLES.ADMIN}><SystemSettings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;