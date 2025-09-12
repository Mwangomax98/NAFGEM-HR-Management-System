import { HRLayout } from "@/components/hr/HRLayout";
import { MyWeeklyTargets } from "@/components/monitoring/MyWeeklyTargets";
import { WeeklyTargetsManagement } from "@/components/monitoring/WeeklyTargetsManagement";
import { useUserRole } from "@/hooks/useUserRole";

export default function METargets() {
  const { userRole } = useUserRole();
  const isHROrAdmin = userRole === 'hr' || userRole === 'admin';

  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {isHROrAdmin ? 'Weekly Targets Management' : 'My Weekly Targets'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isHROrAdmin 
              ? 'Manage and assign weekly targets to team members'
              : 'Track your weekly targets and create tasks to achieve them'
            }
          </p>
        </div>
        {isHROrAdmin ? <WeeklyTargetsManagement /> : <MyWeeklyTargets />}
      </div>
    </HRLayout>
  );
}