import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, Calendar, User } from "lucide-react";
import { useState } from "react";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCourse: (courseData: any) => void;
}

export function CreateCourseModal({ isOpen, onClose, onCreateCourse }: CreateCourseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");
  const [maxEnrollment, setMaxEnrollment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const instructors = [
    { id: "1", name: "Sarah Wilson", department: "HR", expertise: "Leadership, Communication" },
    { id: "2", name: "Mike Chen", department: "Marketing", expertise: "Digital Marketing, Analytics" },
    { id: "3", name: "Anna Rodriguez", department: "Operations", expertise: "Project Management, Process Improvement" },
    { id: "4", name: "David Kim", department: "IT", expertise: "Data Analysis, Programming" },
  ];

  const categories = [
    { value: "leadership", label: "Leadership & Management" },
    { value: "technical", label: "Technical Skills" },
    { value: "communication", label: "Communication" },
    { value: "professional", label: "Professional Development" },
    { value: "compliance", label: "Compliance & Safety" },
  ];

  const handleCreateCourse = () => {
    const courseData = {
      title,
      description,
      instructor: instructors.find(inst => inst.id === instructor)?.name,
      duration,
      category,
      maxEnrollment: parseInt(maxEnrollment) || 50,
      startDate,
      endDate,
      status: "Starting Soon",
      enrolled: 0,
      progress: 0,
      createdDate: new Date().toISOString().split('T')[0],
    };
    
    onCreateCourse(courseData);
    
    // Reset form
    setTitle("");
    setDescription("");
    setInstructor("");
    setDuration("");
    setCategory("");
    setMaxEnrollment("");
    setStartDate("");
    setEndDate("");
    
    onClose();
  };

  const selectedInstructor = instructors.find(inst => inst.id === instructor);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Training Course</DialogTitle>
          <DialogDescription>
            Set up a new training course for employee development
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                placeholder="e.g., Advanced Leadership Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the course objectives, target audience, and key learning outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 8 weeks, 40 hours"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Instructor Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Select value={instructor} onValueChange={setInstructor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{inst.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {inst.department} • {inst.expertise}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInstructor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Instructor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedInstructor.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{selectedInstructor.department}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Expertise</p>
                      <p className="font-medium">{selectedInstructor.expertise}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Schedule & Enrollment */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxEnrollment">Maximum Enrollment</Label>
              <Input
                id="maxEnrollment"
                type="number"
                placeholder="e.g., 25"
                value={maxEnrollment}
                onChange={(e) => setMaxEnrollment(e.target.value)}
              />
            </div>
          </div>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{title || "Course Title"}</h4>
                    <p className="text-sm text-muted-foreground">
                      Instructor: {selectedInstructor?.name || "Not selected"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <BookOpen className="h-4 w-4" />
                    <Calendar className="h-4 w-4" />
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {description || "No description provided"}
                </div>
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Duration: {duration || "Not specified"}</span>
                  <span>Max Enrollment: {maxEnrollment || "50"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCourse}
              disabled={!title || !instructor || !duration}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}