import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hr-hero-image.jpg";

interface WelcomeHeaderProps {
  userName: string;
  userRole: "employee" | "hr" | "admin";
}

export function WelcomeHeader({ userName, userRole }: WelcomeHeaderProps) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    tasks: 0,
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
      const [tasksResult, hoursResult, pendingResult, notificationsResult] = await Promise.all([
        // Tasks count
        userRole === 'employee' 
          ? supabase.from('task_submissions').select('id', { count: 'exact' }).eq('weekly_task_id', null)
          : supabase.from('task_submissions').select('id', { count: 'exact' }),
        
        // Hours logged this week
        userRole === 'employee'
          ? supabase.from('timesheet_entries').select('hours_worked').gte('entry_date', getWeekStart())
          : supabase.from('timesheet_entries').select('hours_worked').gte('entry_date', getWeekStart()),
        
        // Pending items
        userRole === 'hr' || userRole === 'admin'
          ? supabase.from('trip_requests').select('id', { count: 'exact' }).eq('status', 'pending')
          : supabase.from('timesheets').select('id', { count: 'exact' }).eq('employee_id', user.id).eq('status', 'pending'),
        
        // Notifications
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user.id).eq('read', false)
      ]);

      const totalHours = hoursResult.data?.reduce((sum, entry) => sum + Number(entry.hours_worked || 0), 0) || 0;

      setStats({
        tasks: tasksResult.count || 0,
        hoursLogged: Math.round(totalHours),
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
    switch (userRole) {
      case "employee":
        return "Manage your tasks, timesheets, and personal HR needs";
      case "hr":
        return "Oversee employee management and HR operations";
      case "admin":
        return "System administration and analytics dashboard";
      default:
        return "Welcome to NAFGEM HR Management System";
    }
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  const handleQuickActions = () => {
    if (userRole === 'hr' || userRole === 'admin') {
      navigate('/hr/projects');
    } else {
      navigate('/tasks');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-6">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-heading font-bold mb-2 drop-shadow-lg">
                {getGreeting()}, {userName}!
              </h1>
              <p className="text-xl text-white font-body drop-shadow-md">
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

            <div className="flex space-x-4 pt-4">
              <Button variant="teal" size="lg" onClick={handleViewReports}>
                <TrendingUp className="w-5 h-5 mr-2" />
                View Reports
              </Button>
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10" onClick={handleQuickActions}>
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
                  <div className="text-2xl font-highlight font-bold text-white">{stats.tasks}</div>
                  <div className="text-sm text-white/80">Tasks</div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-highlight font-bold text-white">{stats.hoursLogged}h</div>
                  <div className="text-sm text-white/80">Hours Logged</div>
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