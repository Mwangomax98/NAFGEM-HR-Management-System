import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, BarChart, TrendingUp, Trophy, AlertTriangle, Settings } from "lucide-react";

export default function MonitoringEvaluation() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to KPI Dashboard by default
    navigate('/hr/me-dashboard', { replace: true });
  }, [navigate]);

  return (
    <HRLayout>
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-4">
            Monitoring & Evaluation
          </h1>
          <p className="text-muted-foreground mb-8">
            Redirecting to KPI Dashboard...
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/hr/me-dashboard')}>
              <CardHeader>
                <BarChart className="w-8 h-8 text-primary mx-auto" />
                <CardTitle className="text-center">KPI Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Monitor key performance indicators
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/hr/me-trends')}>
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-accent mx-auto" />
                <CardTitle className="text-center">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Analyze performance over time
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/hr/me-scorecard')}>
              <CardHeader>
                <Trophy className="w-8 h-8 text-secondary mx-auto" />
                <CardTitle className="text-center">Performance Scorecard</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Individual and team scores
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/hr/me-gaps')}>
              <CardHeader>
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                <CardTitle className="text-center">Gap Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Identify performance gaps
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/hr/me-targets')}>
              <CardHeader>
                <Target className="w-8 h-8 text-primary mx-auto" />
                <CardTitle className="text-center">Weekly Targets</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Track weekly goals
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/hr/me-management')}>
              <CardHeader>
                <Settings className="w-8 h-8 text-muted-foreground mx-auto" />
                <CardTitle className="text-center">KPI Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Manage KPIs (HR/Admin only)
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HRLayout>
  );
}