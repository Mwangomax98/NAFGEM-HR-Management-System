import { HRLayout } from "@/components/hr/HRLayout";
import { KPIDashboard } from "@/components/monitoring/KPIDashboard";

export default function MEDashboard() {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            KPI Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitor key performance indicators and track organizational progress
          </p>
        </div>
        <KPIDashboard />
      </div>
    </HRLayout>
  );
}