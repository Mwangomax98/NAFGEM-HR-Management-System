import { HRLayout } from "@/components/hr/HRLayout";
import { GapAnalysis } from "@/components/monitoring/GapAnalysis";

export default function MEGaps() {
  return (
    <HRLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Gap Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Identify performance gaps and create action plans for improvement
          </p>
        </div>
        <GapAnalysis />
      </div>
    </HRLayout>
  );
}