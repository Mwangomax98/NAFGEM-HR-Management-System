import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Plus, Filter, Download } from "lucide-react";
import { HRLayout } from "@/components/hr/HRLayout";
import { KPIDashboard } from "@/components/monitoring/KPIDashboard";
import { KPIManagement } from "@/components/monitoring/KPIManagement";
import { GapAnalysis } from "@/components/monitoring/GapAnalysis";
import { WeeklyTargetsManagement } from "@/components/monitoring/WeeklyTargetsManagement";
import { MyWeeklyTargets } from "@/components/monitoring/MyWeeklyTargets";
import { useUserRole } from "@/hooks/useUserRole";

export default function MonitoringEvaluation() {
  const { userRole } = useUserRole();
  const isHROrAdmin = userRole === 'hr' || userRole === 'admin';

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Monitoring & Evaluation
            </h1>
            <p className="text-muted-foreground mt-2">
              Track KPIs, analyze performance gaps, and align tasks with organizational goals
            </p>
          </div>
          {isHROrAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className={`grid w-full ${isHROrAdmin ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            <TabsTrigger value="my-targets">My Targets</TabsTrigger>
            {isHROrAdmin && <TabsTrigger value="weekly-targets">Weekly Targets</TabsTrigger>}
            {isHROrAdmin && <TabsTrigger value="management">KPI Management</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <KPIDashboard />
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
            <GapAnalysis />
          </TabsContent>

          <TabsContent value="my-targets" className="space-y-6">
            <MyWeeklyTargets />
          </TabsContent>

          {isHROrAdmin && (
            <TabsContent value="weekly-targets" className="space-y-6">
              <WeeklyTargetsManagement />
            </TabsContent>
          )}

          {isHROrAdmin && (
            <TabsContent value="management" className="space-y-6">
              <KPIManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </HRLayout>
  );
}