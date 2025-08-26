import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle, Plus, Filter, Download } from "lucide-react";
import { HRLayout } from "@/components/hr/HRLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { HRSidebar } from "@/components/hr/HRSidebar";
import { KPIDashboard } from "@/components/monitoring/KPIDashboard";
import { KPIManagement } from "@/components/monitoring/KPIManagement";
import { GapAnalysis } from "@/components/monitoring/GapAnalysis";
import { useUserRole } from "@/hooks/useUserRole";

export default function MonitoringEvaluation() {
  const { userRole } = useUserRole();
  const isHROrAdmin = userRole === 'hr' || userRole === 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <HRSidebar userRole={userRole || "employee"} userName="User" />
        <main className="flex-1 p-6">
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
            {isHROrAdmin && <TabsTrigger value="management">KPI Management</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <KPIDashboard />
          </TabsContent>

          <TabsContent value="gaps" className="space-y-6">
            <GapAnalysis />
          </TabsContent>

          {isHROrAdmin && (
            <TabsContent value="management" className="space-y-6">
              <KPIManagement />
            </TabsContent>
          )}
          </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}