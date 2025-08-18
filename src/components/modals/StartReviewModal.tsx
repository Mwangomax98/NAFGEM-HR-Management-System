import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Clock, User, Target } from "lucide-react";
import { useState } from "react";

interface StartReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReview: (reviewData: any) => void;
}

export function StartReviewModal({ isOpen, onClose, onStartReview }: StartReviewModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [reviewPeriod, setReviewPeriod] = useState("");
  const [reviewType, setReviewType] = useState("");
  const [goals, setGoals] = useState("");

  const employees = [
    { id: "1", name: "John Smith", department: "Engineering", role: "Senior Developer" },
    { id: "2", name: "Emily Johnson", department: "Marketing", role: "Marketing Manager" },
    { id: "3", name: "Michael Brown", department: "Sales", role: "Sales Representative" },
    { id: "4", name: "Sarah Wilson", department: "HR", role: "HR Specialist" },
  ];

  const reviewPeriods = [
    { value: "q4-2024", label: "Q4 2024" },
    { value: "q1-2025", label: "Q1 2025" },
    { value: "annual-2024", label: "Annual 2024" },
    { value: "mid-year-2024", label: "Mid-Year 2024" },
  ];

  const reviewTypes = [
    { value: "quarterly", label: "Quarterly Review" },
    { value: "annual", label: "Annual Review" },
    { value: "probationary", label: "Probationary Review" },
    { value: "360", label: "360-Degree Review" },
  ];

  const handleStartReview = () => {
    const reviewData = {
      employeeId: selectedEmployee,
      employee: employees.find(emp => emp.id === selectedEmployee)?.name,
      department: employees.find(emp => emp.id === selectedEmployee)?.department,
      period: reviewPeriod,
      type: reviewType,
      goals: goals,
      status: "In Progress",
      startDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 weeks from now
    };
    
    onStartReview(reviewData);
    onClose();
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Start Performance Review</DialogTitle>
          <DialogDescription>
            Initiate a new performance review cycle
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee to review" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.role} • {employee.department}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Employee Info */}
          {selectedEmployeeData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employee Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedEmployeeData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{selectedEmployeeData.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{selectedEmployeeData.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Review</p>
                    <p className="font-medium">Q3 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Review Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Review Period</Label>
              <Select value={reviewPeriod} onValueChange={setReviewPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {reviewPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Review Type</Label>
              <Select value={reviewType} onValueChange={setReviewType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {reviewTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Goals & Objectives */}
          <div className="space-y-2">
            <Label htmlFor="goals">Goals & Objectives for This Period</Label>
            <Textarea
              id="goals"
              placeholder="Enter key goals and objectives to be evaluated in this review..."
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
            />
          </div>

          {/* Review Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Review Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Review Start</span>
                  <Badge variant="outline">Today</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Self-Assessment Due</span>
                  <Badge variant="outline">In 1 week</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Manager Review Due</span>
                  <Badge variant="outline">In 2 weeks</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Review Meeting</span>
                  <Badge variant="outline">In 3 weeks</Badge>
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
              onClick={handleStartReview}
              disabled={!selectedEmployee || !reviewPeriod || !reviewType}
            >
              <Target className="h-4 w-4 mr-2" />
              Start Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}