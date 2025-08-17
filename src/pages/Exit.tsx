import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, FileText, User, Calendar } from "lucide-react";
import { useState } from "react";

export default function Exit() {
  const [exitProcess] = useState({
    initiated: false,
    resignationDate: null,
    lastWorkingDay: null,
    status: "active"
  });

  const [exitChecklist] = useState([
    { id: 1, task: "Submit resignation letter", completed: false, description: "Formal resignation with 2 weeks notice" },
    { id: 2, task: "Complete handover documentation", completed: false, description: "Document ongoing projects and responsibilities" },
    { id: 3, task: "Return company equipment", completed: false, description: "Laptop, ID badge, and other company property" },
    { id: 4, task: "Final timesheet submission", completed: false, description: "Submit timesheet for your last period" },
    { id: 5, task: "Exit interview scheduling", completed: false, description: "Schedule exit interview with HR" },
    { id: 6, task: "Benefits and final pay discussion", completed: false, description: "Review COBRA options and final compensation" }
  ]);

  const completedTasks = exitChecklist.filter(task => task.completed).length;
  const progressPercentage = (completedTasks / exitChecklist.length) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Exit Management</h1>
          <p className="text-muted-foreground">Manage your departure process and transition</p>
        </div>
        {!exitProcess.initiated && (
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Initiate Exit Process
          </Button>
        )}
      </div>

      {!exitProcess.initiated ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Exit Process</CardTitle>
            <CardDescription>
              You currently don't have an active exit process. If you're planning to leave the company, 
              you can initiate the exit process which will guide you through all necessary steps.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
              <User className="w-8 h-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">Need to Leave?</h3>
                <p className="text-sm text-muted-foreground">
                  Click "Initiate Exit Process" to start your departure procedure and ensure a smooth transition.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Exit Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Process Status</CardTitle>
              <CardDescription>Track your departure progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{completedTasks}/{exitChecklist.length} completed</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Resignation Date</p>
                      <p className="text-sm text-muted-foreground">Nov 20, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Working Day</p>
                      <p className="text-sm text-muted-foreground">Dec 4, 2024</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={exitProcess.status === "active" ? "default" : "secondary"}>
                      {exitProcess.status === "active" ? "Active Employee" : "Exit In Progress"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exit Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Exit Checklist</CardTitle>
              <CardDescription>Complete these tasks for a smooth departure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exitChecklist.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0 mt-1">
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.task}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    <Button 
                      variant={item.completed ? "outline" : "default"} 
                      size="sm"
                      disabled={item.completed}
                    >
                      {item.completed ? "Completed" : "Mark Complete"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Notice Period</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Standard notice period is 2 weeks. Please submit your resignation letter accordingly.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100">Benefits Information</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Your health insurance will continue until the end of the month. Contact HR for COBRA options.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100">Contact Information</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                For questions about the exit process, contact HR at hr@nafgem.com or extension 1234.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}