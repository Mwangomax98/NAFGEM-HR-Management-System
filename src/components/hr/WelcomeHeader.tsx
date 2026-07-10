import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/api";
import heroImage from "@/assets/hr-hero-background.jpg";

import { isHrOrAbove, isAdmin, normalizeRole } from "@/lib/roles";

interface WelcomeHeaderProps {
  userName: string;
  userRole: string;
}

export function WelcomeHeader({ userName, userRole }: WelcomeHeaderProps) {
  const role = normalizeRole(userRole);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    reports: 0,
    hoursLogged: 0,
    pending: 0,
    notifications: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadDashboardStats();
  }, [userRole]);

  const loadDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load stats based on user role
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const [reportsResult, tasksResult, pendingResult, notificationsResult] = await Promise.all([
        isHrOrAbove(role)
          ? supabase.from('field_activity_reports').select('id', { count: 'exact', head: true }).gte('activity_date', monthStartStr)
          : supabase.from('field_activity_reports').select('id', { count: 'exact', head: true }).eq('submitted_by', user.id).gte('activity_date', monthStartStr),

        supabase.from('weekly_tasks').select('id', { count: 'exact', head: true })
          .eq('employee_id', user.id)
          .gte('week_start_date', getWeekStart()),

        isHrOrAbove(role)
          ? supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
          : supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('requester_id', user.id).eq('status', 'pending'),

        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false)
      ]);

      setStats({
        reports: reportsResult.count || 0,
        hoursLogged: tasksResult.count || 0,
        pending: pendingResult.count || 0,
        notifications: notificationsResult.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getRoleDescription = () => {
    if (isAdmin(role)) return "System administration and operational metrics";
    if (isHrOrAbove(role)) return "Oversee employee management and HR operations";
    if (role === 'field_officer') return "Submit and track field activity reports";
    if (role === 'manager') return "Review your team's tasks and field activities";
    return "Manage your tasks, leave, staff requests, and training";
  };

  const handleViewReports = () => {
    if (isHrOrAbove(role)) {
      navigate('/hr/field-reports');
    } else {
      navigate('/field-reports');
    }
  };

  const handleQuickActions = () => {
    if (isAdmin(role)) {
      navigate('/admin/users');
    } else if (isHrOrAbove(role)) {
      navigate('/hr/projects');
    } else {
      navigate('/staff-requests');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-6">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/25"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="backdrop-blur-sm bg-black/20 rounded-lg p-4">
              <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-2 drop-shadow-2xl text-shadow-lg">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-xl text-white font-body drop-shadow-xl">
                {getRoleDescription()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{formatDate(currentTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-highlight text-lg">{formatTime(currentTime)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button variant="default" size="lg" onClick={handleViewReports}>
                <TrendingUp className="w-5 h-5 mr-2" />
                View Reports
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/80 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={handleQuickActions}
              >
                <Users className="w-5 h-5 mr-2" />
                Quick Actions
              </Button>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="mt-8 lg:mt-0 lg:ml-8">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">{stats.reports}</div>
                  <div className="text-sm text-white/80">Reports</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">{stats.hoursLogged}</div>
                  <div className="text-sm text-white/80">Tasks</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">{stats.pending}</div>
                  <div className="text-sm text-white/80">Pending</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">{stats.notifications}</div>
                  <div className="text-sm text-white/80">Notifications</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}