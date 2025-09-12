import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEmployeeNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    // Set up real-time subscription for employee-related notifications
    const subscription = supabase
      .channel('employee_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'employee_profiles'
        },
        (payload) => {
          const newEmployee = payload.new as any;
          console.log('New employee notification:', newEmployee);
          
          // Only show notification if user has HR/Admin role
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle()
                .then(({ data: role }) => {
                  if (role && ['hr', 'admin'].includes(role.role)) {
                    toast({
                      title: "New Employee Added",
                      description: `${newEmployee.name_full} (${newEmployee.employee_id}) has been added to the system.`,
                    });
                  }
                });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employee_profiles'
        },
        (payload) => {
          const updatedEmployee = payload.new as any;
          const oldEmployee = payload.old as any;
          
          // Check for status changes
          if (oldEmployee.status !== updatedEmployee.status) {
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (user) {
                supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', user.id)
                  .maybeSingle()
                  .then(({ data: role }) => {
                    if (role && ['hr', 'admin'].includes(role.role)) {
                      toast({
                        title: "Employee Status Updated",
                        description: `${updatedEmployee.name_full} status changed from ${oldEmployee.status} to ${updatedEmployee.status}.`,
                      });
                    }
                  });
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  return null; // This hook only sets up subscriptions
}