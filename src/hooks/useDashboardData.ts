import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  // Employee Data
  todaysTasks: number;
  completedTasks: number;
  totalTasks: number;
  pendingLeaveRequests: number;
  pendingTripRequests: number;
  weeklyHours: number;
  performance: number;
  
  // HR Data
  totalEmployees: number;
  pendingApprovals: number;
  activeProjects: number;
  avgPerformance: number;
  
  // Admin Data
  totalUsers: number;
  systemHealth: number;
  monthlyBudget: number;
  userSatisfaction: number;
}

export interface TaskProgress {
  id: string;
  title: string;
  description: string;
  completion_percentage: number;
  priority: 'low' | 'medium' | 'high';
  planned_completion_date: string;
  actual_completion_date?: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface PendingRequest {
  id: string;
  type: 'leave' | 'trip' | 'timesheet';
  title: string;
  status: string;
  created_at: string;
  requester_name?: string;
}

export function useDashboardData(userRole: string) {
  const [stats, setStats] = useState<DashboardStats>({
    todaysTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    pendingLeaveRequests: 0,
    pendingTripRequests: 0,
    weeklyHours: 0,
    performance: 0,
    totalEmployees: 0,
    pendingApprovals: 0,
    activeProjects: 0,
    avgPerformance: 0,
    totalUsers: 0,
    systemHealth: 100,
    monthlyBudget: 0,
    userSatisfaction: 0,
  });
  
  const [todaysTasks, setTodaysTasks] = useState<TaskProgress[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployeeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch task submissions for current week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { data: tasks } = await supabase
        .from('task_submissions')
        .select(`
          id,
          task_title,
          task_description,
          completion_percentage,
          priority,
          planned_completion_date,
          actual_completion_date,
          completion_status,
          weekly_tasks!inner(employee_id, week_start_date, week_end_date)
        `)
        .eq('weekly_tasks.employee_id', user.id)
        .gte('weekly_tasks.week_start_date', startOfWeek.toISOString().split('T')[0])
        .lte('weekly_tasks.week_end_date', endOfWeek.toISOString().split('T')[0]);

      const taskData: TaskProgress[] = tasks?.map(task => ({
        id: task.id,
        title: task.task_title,
        description: task.task_description || '',
        completion_percentage: task.completion_percentage || 0,
        priority: task.priority as 'low' | 'medium' | 'high',
        planned_completion_date: task.planned_completion_date,
        actual_completion_date: task.actual_completion_date,
        status: task.completion_status as 'not_started' | 'in_progress' | 'completed'
      })) || [];

      setTodaysTasks(taskData);

      // Fetch pending leave requests
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('id, employee_name, status, created_at')
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      // Fetch pending trip requests
      const { data: tripRequests } = await supabase
        .from('trip_requests')
        .select('id, purpose, status, created_at')
        .eq('requester_id', user.id)
        .in('status', ['pending', 'approved']);

      // Fetch timesheet data for weekly hours
      const { data: timesheets } = await supabase
        .from('timesheets')
        .select('total_hours')
        .eq('employee_id', user.id)
        .gte('week_start_date', startOfWeek.toISOString().split('T')[0])
        .lte('week_end_date', endOfWeek.toISOString().split('T')[0]);

      const weeklyHours = timesheets?.reduce((sum, ts) => sum + (ts.total_hours || 0), 0) || 0;
      const completedTasks = taskData.filter(t => t.status === 'completed').length;

      setStats(prev => ({
        ...prev,
        todaysTasks: taskData.length,
        completedTasks,
        totalTasks: taskData.length,
        pendingLeaveRequests: leaveRequests?.length || 0,
        pendingTripRequests: tripRequests?.length || 0,
        weeklyHours,
        performance: taskData.length > 0 ? Math.round((completedTasks / taskData.length) * 100) : 0
      }));

      // Format pending requests
      const requests: PendingRequest[] = [
        ...(leaveRequests?.map(req => ({
          id: req.id,
          type: 'leave' as const,
          title: `Leave Request`,
          status: req.status,
          created_at: req.created_at
        })) || []),
        ...(tripRequests?.map(req => ({
          id: req.id,
          type: 'trip' as const,
          title: req.purpose,
          status: req.status,
          created_at: req.created_at
        })) || [])
      ];

      setPendingRequests(requests);

    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const fetchHRData = async () => {
    try {
      // Fetch total employees
      const { count: employeeCount } = await supabase
        .from('employee_profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Fetch pending approvals
      const { data: pendingLeave } = await supabase
        .from('leave_requests')
        .select('id, employee_name, status, created_at')
        .eq('status', 'pending');

      const { data: pendingTrips } = await supabase
        .from('trip_requests')
        .select('id, purpose, status, created_at, requester_id')
        .eq('status', 'pending');

      const { data: pendingTimesheets } = await supabase
        .from('timesheets')
        .select('id, employee_id, status, created_at')
        .eq('status', 'submitted');

      // Fetch active projects
      const { data: projects } = await supabase
        .from('kpis')
        .select('project_id')
        .eq('is_active', true);

      const uniqueProjects = new Set(projects?.map(p => p.project_id));

      setStats(prev => ({
        ...prev,
        totalEmployees: employeeCount || 0,
        pendingApprovals: (pendingLeave?.length || 0) + (pendingTrips?.length || 0) + (pendingTimesheets?.length || 0),
        activeProjects: uniqueProjects.size,
        avgPerformance: 85 // Placeholder
      }));

      // Format pending requests for HR
      const requests: PendingRequest[] = [
        ...(pendingLeave?.map(req => ({
          id: req.id,
          type: 'leave' as const,
          title: `Leave Request - ${req.employee_name}`,
          status: req.status,
          created_at: req.created_at,
          requester_name: req.employee_name
        })) || []),
        ...(pendingTrips?.map(req => ({
          id: req.id,
          type: 'trip' as const,
          title: `Trip: ${req.purpose}`,
          status: req.status,
          created_at: req.created_at
        })) || []),
        ...(pendingTimesheets?.map(req => ({
          id: req.id,
          type: 'timesheet' as const,
          title: `Timesheet Approval`,
          status: req.status,
          created_at: req.created_at
        })) || [])
      ];

      setPendingRequests(requests);

    } catch (error) {
      console.error('Error fetching HR data:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0,
        systemHealth: 98,
        monthlyBudget: 50000,
        userSatisfaction: 4.2
      }));

    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        if (userRole === 'employee') {
          await fetchEmployeeData();
        } else if (userRole === 'hr') {
          await fetchHRData();
        } else if (userRole === 'admin') {
          await fetchAdminData();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      fetchData();
    }
  }, [userRole, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userRole) return;

    const channels: any[] = [];

    if (userRole === 'employee') {
      // Subscribe to task updates
      const taskChannel = supabase
        .channel('task-updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'task_submissions' },
          () => fetchEmployeeData()
        )
        .subscribe();
      channels.push(taskChannel);
    }

    if (userRole === 'hr') {
      // Subscribe to approval updates
      const approvalChannel = supabase
        .channel('approval-updates')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'leave_requests' },
          () => fetchHRData()
        )
        .subscribe();
      channels.push(approvalChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [userRole]);

  return {
    stats,
    todaysTasks,
    pendingRequests,
    loading,
    refetch: () => {
      if (userRole === 'employee') fetchEmployeeData();
      else if (userRole === 'hr') fetchHRData();
      else if (userRole === 'admin') fetchAdminData();
    }
  };
}