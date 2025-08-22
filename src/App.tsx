import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ProjectManagement from "./pages/hr/ProjectManagement";
import TimesheetApprovals from "./pages/hr/TimesheetApprovals";
import LeaveApprovals from "./pages/hr/LeaveApprovals";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import TripManagement from "./pages/hr/TripManagement";
import Training from "./pages/hr/Training";
import Performance from "./pages/hr/Performance";
import TaskManagement from "./pages/hr/TaskManagement";
import Communications from "./pages/Communications";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/timesheets" element={<Timesheets />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/exit" element={<Exit />} />
          <Route path="/hr/employee-management" element={<EmployeeManagement />} />
          <Route path="/hr/projects" element={<ProjectManagement />} />
          <Route path="/hr/timesheet-approvals" element={<TimesheetApprovals />} />
          <Route path="/hr/leave-approvals" element={<LeaveApprovals />} />
          <Route path="/hr/trip-management" element={<TripManagement />} />
          <Route path="/hr/training" element={<Training />} />
          <Route path="/hr/performance" element={<Performance />} />
          <Route path="/hr/task-management" element={<TaskManagement />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/settings" element={<SystemSettings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;