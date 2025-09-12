import { HRLayout } from "@/components/hr/HRLayout";
import { TrendAnalysis } from "@/components/monitoring/TrendAnalysis";

export default function METrends() {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Performance Trends
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze performance trends and identify patterns over time
          </p>
        </div>
        <TrendAnalysis />
      </div>
    </HRLayout>
  );
}