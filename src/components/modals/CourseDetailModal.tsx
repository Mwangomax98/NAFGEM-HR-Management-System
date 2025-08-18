import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Users, Clock, Calendar, Star, BookOpen } from "lucide-react";

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    instructor: string;
    enrolled: number;
    duration: string;
    status: string;
    progress: number;
  };
}

export function CourseDetailModal({ isOpen, onClose, course }: CourseDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500";
      case "Starting Soon": return "bg-blue-500";
      case "Completed": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const modules = [
    { id: 1, title: "Introduction to Leadership", duration: "2 hours", completed: true },
    { id: 2, title: "Team Management", duration: "3 hours", completed: true },
    { id: 3, title: "Communication Skills", duration: "2.5 hours", completed: false },
    { id: 4, title: "Decision Making", duration: "2 hours", completed: false },
    { id: 5, title: "Conflict Resolution", duration: "3 hours", completed: false },
  ];

  const enrolledStudents = [
    { name: "John Smith", department: "Engineering", progress: 75 },
    { name: "Sarah Wilson", department: "Marketing", progress: 90 },
    { name: "Mike Johnson", department: "Sales", progress: 60 },
    { name: "Emily Davis", department: "HR", progress: 85 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {course.title}
            <Badge className={getStatusColor(course.status)}>
              {course.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Instructor: {course.instructor} • Duration: {course.duration}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.enrolled}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.duration}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{course.progress}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7</div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Course Modules */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Course Modules</h3>
            <div className="space-y-3">
              {modules.map((module) => (
                <Card key={module.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{module.title}</span>
                          {module.completed && <Badge variant="default" className="bg-green-500">Completed</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{module.duration}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        {module.completed ? "Review" : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Enrolled Students */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Enrolled Students</h3>
            <div className="space-y-3">
              {enrolledStudents.map((student, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{student.name}</span>
                          <Badge variant="outline">{student.department}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Progress:</span>
                          <Progress value={student.progress} className="w-32 h-2" />
                          <span className="text-sm">{student.progress}%</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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
                Edit Course
              </Button>
              <Button variant="outline" size="sm">
                Export Report
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                Manage Course
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}