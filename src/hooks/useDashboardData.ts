import { useState, useEffect } from 'react';
import { supabase } from "@/lib/api";
import { useToast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';

export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  pendingLeaveRequests: number;
  fieldReportsThisMonth: number;
  certsExpiringSoon: number;
  pendingTripRequests: number;
  pendingApprovals: number;
  totalUsers: number;
  weeklyTasks: number;
}

export interface PendingRequest {
  id: string;
  type: 'leave' | 'trip';
  title: string;
  status: string;
  created_at: string;
  requester_name?: string;
}

export interface ExpiringCert {
  id: string;
  certificate_name: string;
  expiry_date: string;
  employee_id: string;
}

export function useDashboardData(userRole: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeProjects: 0,
    pendingLeaveRequests: 0,
    fieldReportsThisMonth: 0,
    certsExpiringSoon: 0,
    pendingTripRequests: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    weeklyTasks: 0,
  });

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [expiringCerts, setExpiringCerts] = useState<ExpiringCert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const monthStart = new Date();
  monthStart.setDate(1);
  const certCutoff = format(addDays(new Date(), 60), 'yyyy-MM-dd');

  const fetchEmployeeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

      const [{ data: leaveRequests }, { data: tripRequests }, { count: taskCount }] = await Promise.all([
        supabase.from('leave_requests').select('id, status, created_at').eq('requester_id', user.id).eq('status', 'pending'),
        supabase.from('trip_requests').select('id, purpose, status, created_at').eq('requester_id', user.id).in('status', ['pending', 'approved']),
        supabase.from('weekly_tasks').select('*', { count: 'exact', head: true })
          .eq('employee_id', user.id)
          .gte('week_start_date', startOfWeek.toISOString().split('T')[0]),
      ]);

      setStats((prev) => ({
        ...prev,
        pendingLeaveRequests: leaveRequests?.length || 0,
        pendingTripRequests: tripRequests?.length || 0,
        weeklyTasks: taskCount || 0,
      }));

      setPendingRequests([
        ...(leaveRequests?.map((req) => ({
          id: req.id,
          type: 'leave' as const,
          title: 'Leave Request',
          status: req.status,
          created_at: req.created_at,
        })) || []),
        ...(tripRequests?.map((req) => ({
          id: req.id,
          type: 'trip' as const,
          title: req.purpose,
          status: req.status,
          created_at: req.created_at,
        })) || []),
      ]);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    }
  };

  const fetchHRData = async () => {
    try {
      const [
        { count: employeeCount },
        { data: pendingLeave },
        { data: pendingTrips },
        { count: projectCount },
        { count: reportCount },
        { count: certCount },
      ] = await Promise.all([
        supabase.from('employee_profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('leave_requests').select('id, employee_name, status, created_at').eq('status', 'pending'),
        supabase.from('trip_requests').select('id, purpose, status, created_at').eq('status', 'pending'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('field_activity_reports').select('*', { count: 'exact', head: true })
          .gte('activity_date', format(monthStart, 'yyyy-MM-dd')),
        supabase.from('employee_certifications').select('*', { count: 'exact', head: true })
          .lte('expiry_date', certCutoff).gte('expiry_date', format(new Date(), 'yyyy-MM-dd')),
      ]);

      setStats((prev) => ({
        ...prev,
        totalEmployees: employeeCount || 0,
        pendingApprovals: (pendingLeave?.length || 0) + (pendingTrips?.length || 0),
        activeProjects: projectCount || 0,
        pendingLeaveRequests: pendingLeave?.length || 0,
        fieldReportsThisMonth: reportCount || 0,
        certsExpiringSoon: certCount || 0,
      }));

      setPendingRequests([
        ...(pendingLeave?.map((req) => ({
          id: req.id,
          type: 'leave' as const,
          title: `Leave Request - ${req.employee_name}`,
          status: req.status,
          created_at: req.created_at,
          requester_name: req.employee_name,
        })) || []),
      ]);
    } catch (error) {
      console.error('Error fetching HR data:', error);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [
        { count: userCount },
        { count: employeeCount },
        { count: projectCount },
        { count: leaveCount },
        { count: reportCount },
        { count: certCount },
        { data: certs },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('employee_profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('field_activity_reports').select('*', { count: 'exact', head: true })
          .gte('activity_date', format(monthStart, 'yyyy-MM-dd')),
        supabase.from('employee_certifications').select('*', { count: 'exact', head: true })
          .lte('expiry_date', certCutoff).gte('expiry_date', format(new Date(), 'yyyy-MM-dd')),
        supabase.from('employee_certifications').select('id, certificate_name, expiry_date, employee_id')
          .lte('expiry_date', certCutoff).gte('expiry_date', format(new Date(), 'yyyy-MM-dd'))
          .order('expiry_date').limit(10),
      ]);

      setStats({
        totalUsers: userCount || 0,
        totalEmployees: employeeCount || 0,
        activeProjects: projectCount || 0,
        pendingLeaveRequests: leaveCount || 0,
        fieldReportsThisMonth: reportCount || 0,
        certsExpiringSoon: certCount || 0,
        pendingTripRequests: 0,
        pendingApprovals: 0,
        weeklyTasks: 0,
      });

      setExpiringCerts(certs || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const refetch = async () => {
    const role = userRole?.toLowerCase() || '';
    if (role === 'employee' || role === 'field_officer' || role === 'manager') {
      await fetchEmployeeData();
    } else if (role === 'hr' || role === 'hr_admin') {
      await fetchHRData();
    } else {
      await fetchAdminData();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await refetch();
      } catch {
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (userRole) fetchData();
  }, [userRole]);

  useEffect(() => {
    if (!userRole) return;
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [userRole]);

  return { stats, pendingRequests, expiringCerts, loading, refetch };
}
