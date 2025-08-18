import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Play, Award } from "lucide-react";
import { useState } from "react";

interface CourseProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: {
    id: number;
    name: string;
    email: string;
    department: string;
    coursesCompleted: number;
    currentCourses: number;
    certifications: number;
  };
}

export function CourseProgressModal({ isOpen, onClose, employee }: CourseProgressModalProps) {
  const [currentCourses] = useState([
    { 
      id: 1, 
      title: "Leadership Development", 
      progress: 75, 
      modules: 8, 
      completed: 6, 
      nextModule: "Decision Making",
      dueDate: "2024-02-15"
    },
    { 
      id: 2, 
      title: "Digital Marketing Fundamentals", 
      progress: 30, 
      modules: 6, 
      completed: 2, 
      nextModule: "SEO Basics",
      dueDate: "2024-03-01"
    },
  ]);

  const [completedCourses] = useState([
    { id: 1, title: "Project Management Essentials", completedDate: "2024-01-10", grade: "A", certification: true },
    { id: 2, title: "Communication Skills", completedDate: "2023-12-15", grade: "B+", certification: false },
    { id: 3, title: "Time Management", completedDate: "2023-11-20", grade: "A-", certification: true },
  ]);

  const handleContinueCourse = (courseId: number) => {
    console.log(`Continuing course ${courseId}`);
    // In real app, would navigate to course content
  };

  const handleViewCertificate = (courseId: number) => {
    console.log(`Viewing certificate for course ${courseId}`);
    // In real app, would open certificate modal/PDF
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Training Progress - {employee.name}</DialogTitle>
          <DialogDescription>
            {employee.department} • {employee.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employee.coursesCompleted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employee.currentCourses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certifications</CardTitle>
                <Award className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employee.certifications}</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Current Courses */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Courses</h3>
            <div className="space-y-4">
              {currentCourses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Next: {course.nextModule} • Due: {course.dueDate}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {course.completed}/{course.modules} modules
                        </Badge>
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
                          size="sm" 
                          onClick={() => handleContinueCourse(course.id)}
                          className="flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" />
                          Continue Learning
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Completed Courses */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Completed Courses</h3>
            <div className="space-y-3">
              {completedCourses.map((course) => (
                <Card key={course.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{course.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Completed: {course.completedDate} • Grade: {course.grade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.certification && (
                          <Badge variant="default" className="bg-yellow-500">
                            <Award className="h-3 w-3 mr-1" />
                            Certified
                          </Badge>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCertificate(course.id)}
                          disabled={!course.certification}
                        >
                          Certificate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Assign New Course
              </Button>
              <Button variant="outline" size="sm">
                Export Progress Report
              </Button>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}