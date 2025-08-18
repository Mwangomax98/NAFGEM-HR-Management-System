import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, CheckSquare, Clock, Users, AlertCircle } from "lucide-react";

const TaskManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const taskStats = [
    { title: "Total Tasks", value: "127", icon: CheckSquare, change: "+8 this week" },
    { title: "In Progress", value: "43", icon: Clock, change: "34% of total" },
    { title: "Team Members", value: "28", icon: Users, change: "Across 5 departments" },
    { title: "Overdue", value: "5", icon: AlertCircle, change: "Requires attention" },
  ];

  const tasks = [
    { 
      id: 1, 
      title: "Quarterly Performance Reviews", 
      assignee: "Sarah Johnson", 
      department: "HR", 
      priority: "High", 
      status: "In Progress", 
      progress: 65,
      dueDate: "2024-01-20",
      description: "Complete Q4 performance evaluations for engineering team"
    },
    { 
      id: 2, 
      title: "New Employee Onboarding", 
      assignee: "Mike Wilson", 
      department: "HR", 
      priority: "Medium", 
      status: "Pending", 
      progress: 0,
      dueDate: "2024-01-25",
      description: "Prepare onboarding materials for 3 new hires"
    },
    { 
      id: 3, 
      title: "Policy Documentation Update", 
      assignee: "Anna Rodriguez", 
      department: "HR", 
      priority: "Low", 
      status: "Completed", 
      progress: 100,
      dueDate: "2024-01-15",
      description: "Update employee handbook with new remote work policies"
    },
  ];

  const projects = [
    { id: 1, name: "Employee Wellness Initiative", tasks: 12, completed: 8, team: "HR Team", deadline: "2024-03-31" },
    { id: 2, name: "Recruitment Automation", tasks: 8, completed: 3, team: "HR Tech", deadline: "2024-02-28" },
    { id: 3, name: "Training Platform Migration", tasks: 15, completed: 12, team: "L&D Team", deadline: "2024-02-15" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      case "Pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-500";
      case "Medium": return "bg-yellow-500";
      case "Low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground mt-2">Coordinate HR tasks and track team productivity</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Sort</Button>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>{task.assignee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{task.assignee}</div>
                        <div className="text-sm text-muted-foreground">{task.department}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {task.dueDate}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Update Progress</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>Team: {project.team}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tasks Completed</span>
                      <span>{project.completed}/{project.tasks}</span>
                    </div>
                    <Progress value={(project.completed / project.tasks) * 100} className="h-2" />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Deadline: {project.deadline}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">View Tasks</Button>
                    <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Calendar</CardTitle>
              <CardDescription>View tasks and deadlines in calendar format</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Calendar view coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Reports</CardTitle>
              <CardDescription>Team productivity and task completion analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Reports dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskManagement;