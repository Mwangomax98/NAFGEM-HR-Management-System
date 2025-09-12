import { HRLayout } from "@/components/hr/HRLayout";
import { KPIManagement } from "@/components/monitoring/KPIManagement";

export default function MEManagement() {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            KPI Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage key performance indicators
          </p>
        </div>
        <KPIManagement />
      </div>
    </HRLayout>
  );
}