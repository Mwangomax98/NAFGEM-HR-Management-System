import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeeklyPerformanceReview from "@/components/hr/WeeklyPerformanceReview";

const Performance = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Performance Reviews</h1>
        <p className="text-muted-foreground mt-2">
          Review weekly task submissions and evaluate employee performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Task Reviews</CardTitle>
          <CardDescription>
            Evaluate submitted weekly tasks for the selected week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyPerformanceReview />
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;
