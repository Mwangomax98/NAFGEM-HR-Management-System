import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Calendar, Target, TrendingUp } from "lucide-react";
import { exportReviewToPDF } from "@/utils/pdfExport";
import { toast } from "@/hooks/use-toast";

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    id: number;
    employee: string;
    reviewer: string;
    period: string;
    status: string;
    score: number | null;
    dueDate: string;
    department: string;
  };
}

export function ReviewDetailModal({ isOpen, onClose, review }: ReviewDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      case "Pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const reviewSections = [
    { 
      title: "Communication Skills", 
      score: 4.5, 
      feedback: "Excellent communication with team members and stakeholders. Clear and concise in written and verbal communication."
    },
    { 
      title: "Technical Expertise", 
      score: 4.2, 
      feedback: "Strong technical skills with room for improvement in emerging technologies. Consistently delivers quality work."
    },
    { 
      title: "Leadership", 
      score: 4.0, 
      feedback: "Shows good leadership potential. Has successfully led small projects and mentored junior team members."
    },
    { 
      title: "Problem Solving", 
      score: 4.8, 
      feedback: "Outstanding problem-solving abilities. Able to identify issues early and propose innovative solutions."
    },
  ];

  const goals = [
    { title: "Complete advanced certification", progress: 75, dueDate: "2024-06-30" },
    { title: "Lead cross-functional project", progress: 50, dueDate: "2024-09-30" },
    { title: "Mentor 2 junior developers", progress: 90, dueDate: "2024-12-31" },
  ];

  const averageScore = reviewSections.reduce((acc, section) => acc + section.score, 0) / reviewSections.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Performance Review - {review.employee}
            <Badge className={getStatusColor(review.status)}>
              {review.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {review.period} • Reviewer: {review.reviewer} • Department: {review.department}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
                <div className="flex items-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= averageScore ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Period</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{review.period}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{review.dueDate}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Improvement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+0.3</div>
                <p className="text-xs text-muted-foreground">vs last review</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Employee Info */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback>{review.employee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{review.employee}</h3>
              <p className="text-muted-foreground">{review.department}</p>
              <p className="text-sm text-muted-foreground">Reviewed by: {review.reviewer}</p>
            </div>
          </div>

          <Separator />

          {/* Review Sections */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Areas</h3>
            <div className="space-y-4">
              {reviewSections.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{section.score}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{section.feedback}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Goals */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Goals & Objectives</h3>
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{goal.title}</span>
                        <span className="text-sm text-muted-foreground">Due: {goal.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={goal.progress} className="flex-1 h-2" />
                        <span className="text-sm">{goal.progress}%</span>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  exportReviewToPDF(review, reviewSections, goals);
                  toast({
                    title: "PDF Export",
                    description: "Review PDF is being generated",
                  });
                }}
              >
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                Send to Employee
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {review.status !== "Completed" && (
                <Button>
                  Continue Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}