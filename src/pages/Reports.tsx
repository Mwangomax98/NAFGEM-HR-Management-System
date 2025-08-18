import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { BarChart, LineChart, PieChart, Download, Filter, Calendar as CalendarIcon, TrendingUp, Users, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("quarterly");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const analyticsStats = [
    { title: "Total Employees", value: "248", icon: Users, change: "+12 this month", trend: "up" },
    { title: "Avg Performance", value: "4.3", icon: TrendingUp, change: "+0.2 from last quarter", trend: "up" },
    { title: "Training Hours", value: "1,240", icon: Clock, change: "+15% this quarter", trend: "up" },
    { title: "Cost Per Employee", value: "$3,450", icon: DollarSign, change: "-5% optimized", trend: "down" },
  ];

  const reportCategories = [
    { 
      id: "employee", 
      title: "Employee Reports", 
      description: "Demographics, turnover, satisfaction",
      reports: ["Employee Demographics", "Turnover Analysis", "Satisfaction Survey", "Headcount Trends"]
    },
    { 
      id: "performance", 
      title: "Performance Reports", 
      description: "Reviews, goals, ratings, improvements",
      reports: ["Performance Ratings", "Goal Achievement", "Review Completion", "Performance Trends"]
    },
    { 
      id: "training", 
      title: "Training & Development", 
      description: "Learning progress, certifications, costs",
      reports: ["Training Completion", "Certification Status", "Learning ROI", "Skills Gap Analysis"]
    },
    { 
      id: "financial", 
      title: "Financial Reports", 
      description: "Compensation, benefits, budget analysis",
      reports: ["Compensation Analysis", "Benefits Utilization", "Training Costs", "Budget vs Actual"]
    },
  ];

  const recentReports = [
    { id: 1, name: "Q4 2024 Performance Summary", type: "Performance", generatedBy: "Sarah Johnson", date: "2024-01-15", status: "Ready" },
    { id: 2, name: "Employee Satisfaction Survey", type: "Employee", generatedBy: "Mike Wilson", date: "2024-01-14", status: "Processing" },
    { id: 3, name: "Training ROI Analysis", type: "Training", generatedBy: "Anna Rodriguez", date: "2024-01-13", status: "Ready" },
    { id: 4, name: "Compensation Benchmarking", type: "Financial", generatedBy: "David Kim", date: "2024-01-12", status: "Ready" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready": return "bg-green-500";
      case "Processing": return "bg-blue-500";
      case "Failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? "↗" : "↙";
  };

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">Generate insights and track organizational metrics</p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                <span className={`text-lg ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Customize your analytics and reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="quarterly">This Quarter</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Report Library</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Employee Performance Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Exceeds Expectations</span>
                      <span>24 employees</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Meets Expectations</span>
                      <span>186 employees</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Needs Improvement</span>
                      <span>38 employees</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Training Completion Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Interactive chart coming soon...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Department Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Department distribution chart coming soon...</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-muted-foreground">{report.date}</div>
                    </div>
                    <Badge className={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.reports.map((report) => (
                    <div key={report} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <span className="font-medium">{report}</span>
                      <Button variant="outline" size="sm">Generate</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Create custom reports with specific metrics and filters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Custom report builder coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Manage automated report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Scheduled reports management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;