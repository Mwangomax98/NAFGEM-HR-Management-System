import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, BookOpen, Users, Calendar, Award } from "lucide-react";
import { CourseDetailModal } from "@/components/modals/CourseDetailModal";
import { CourseProgressModal } from "@/components/modals/CourseProgressModal";
import { CreateCourseModal } from "@/components/modals/CreateCourseModal";

const Training = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<typeof employees[0] | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);

  const [courses, setCourses] = useState([]);

  const trainingStats = [
    { title: "Active Courses", value: "0", icon: BookOpen, change: "No courses yet" },
    { title: "Enrolled Employees", value: "0", icon: Users, change: "No enrollments" },
    { title: "Scheduled Sessions", value: "0", icon: Calendar, change: "No sessions" },
    { title: "Certifications", value: "0", icon: Award, change: "No certifications" },
  ];

  const employees = [];

  const openEmployeeProgress = (employee: typeof employees[0]) => {
    setSelectedEmployee(employee);
    setIsProgressModalOpen(true);
  };

  const handleCreateCourse = (courseData: any) => {
    const newCourse = {
      id: courses.length + 1,
      ...courseData
    };
    setCourses([...courses, newCourse]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500";
      case "Starting Soon": return "bg-blue-500";
      case "Completed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Training & Development</h1>
          <p className="text-muted-foreground mt-2">Manage employee training programs and track learning progress</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsCreateCourseOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trainingStats.map((stat) => (
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
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="employees">Employee Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search courses..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {courses.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle className="text-muted-foreground">No Training Courses Available</CardTitle>
                <CardDescription>No training courses have been created yet. Click "Create Course" to add your first course.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>Instructor: {course.instructor}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.enrolled} enrolled</span>
                      <span>{course.duration}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsCourseDetailOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">Manage</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          {employees.length === 0 ? (
            <Card className="text-center py-12">
              <CardHeader>
                <CardTitle className="text-muted-foreground">No Employee Training Records</CardTitle>
                <CardDescription>No employees have training records yet. Employee progress will appear here once courses are created and employees are enrolled.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Completed Courses</TableHead>
                  <TableHead>Current Courses</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.coursesCompleted}</TableCell>
                    <TableCell>{employee.currentCourses}</TableCell>
                    <TableCell>{employee.certifications}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEmployeeProgress(employee)}
                      >
                        View Progress
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

      </Tabs>

      {selectedCourse && (
        <CourseDetailModal
          isOpen={isCourseDetailOpen}
          onClose={() => setIsCourseDetailOpen(false)}
          course={selectedCourse}
        />
      )}

      {selectedEmployee && (
        <CourseProgressModal
          isOpen={isProgressModalOpen}
          onClose={() => setIsProgressModalOpen(false)}
          employee={selectedEmployee}
        />
      )}

      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onCreateCourse={handleCreateCourse}
      />
    </div>
  );
};

export default Training;