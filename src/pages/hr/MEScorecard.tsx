import { HRLayout } from "@/components/hr/HRLayout";
import { PerformanceScorecard } from "@/components/monitoring/PerformanceScorecard";

export default function MEScorecard() {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Performance Scorecard
          </h1>
          <p className="text-muted-foreground mt-2">
            Individual and team performance scores with detailed analysis
          </p>
        </div>
        <PerformanceScorecard />
      </div>
    </HRLayout>
  );
}