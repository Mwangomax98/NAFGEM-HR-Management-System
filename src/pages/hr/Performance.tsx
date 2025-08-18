import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Target, TrendingUp, Calendar, Star } from "lucide-react";
import { ReviewDetailModal } from "@/components/modals/ReviewDetailModal";
import { StartReviewModal } from "@/components/modals/StartReviewModal";

const Performance = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReview, setSelectedReview] = useState<typeof reviews[0] | null>(null);
  const [isReviewDetailOpen, setIsReviewDetailOpen] = useState(false);
  const [isStartReviewOpen, setIsStartReviewOpen] = useState(false);

  const [reviews, setReviews] = useState([
    { 
      id: 1, 
      employee: "John Smith", 
      reviewer: "Sarah Johnson", 
      period: "Q4 2024", 
      status: "In Progress", 
      score: 4.5, 
      dueDate: "2024-01-15",
      department: "Engineering"
    },
    { 
      id: 2, 
      employee: "Emily Davis", 
      reviewer: "Mike Wilson", 
      period: "Q4 2024", 
      status: "Completed", 
      score: 4.8, 
      dueDate: "2024-01-10",
      department: "Marketing"
    },
    { 
      id: 3, 
      employee: "Michael Brown", 
      reviewer: "Anna Rodriguez", 
      period: "Q4 2024", 
      status: "Pending", 
      score: null, 
      dueDate: "2024-01-20",
      department: "Sales"
    },
  ]);

  const performanceStats = [
    { title: "Active Reviews", value: "42", icon: Target, change: "Q4 2024 cycle" },
    { title: "Avg Performance Score", value: "4.2", icon: TrendingUp, change: "+0.3 from last quarter" },
    { title: "Pending Reviews", value: "18", icon: Calendar, change: "Due this week" },
    { title: "Top Performers", value: "24", icon: Star, change: "Exceeds expectations" },
  ];

  const goals = [
    { id: 1, employee: "John Smith", title: "Complete React certification", progress: 75, dueDate: "2024-02-28", priority: "High" },
    { id: 2, employee: "Emily Davis", title: "Lead marketing campaign", progress: 90, dueDate: "2024-01-31", priority: "Medium" },
    { id: 3, employee: "Michael Brown", title: "Achieve 120% sales target", progress: 85, dueDate: "2024-03-31", priority: "High" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-500";
      case "In Progress": return "bg-blue-500";
      case "Pending": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const handleStartReview = (reviewData: any) => {
    const newReview = {
      id: reviews.length + 1,
      ...reviewData
    };
    setReviews([...reviews, newReview]);
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
          <h1 className="text-3xl font-bold">Performance Reviews</h1>
          <p className="text-muted-foreground mt-2">Manage performance evaluations and track employee goals</p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => setIsStartReviewOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Start Review Cycle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceStats.map((stat) => (
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
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
          <TabsTrigger value="templates">Review Templates</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search reviews..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>{review.employee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{review.employee}</div>
                      <div className="text-sm text-muted-foreground">{review.department}</div>
                    </div>
                  </TableCell>
                  <TableCell>{review.reviewer}</TableCell>
                  <TableCell>{review.period}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(review.status)}>
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {review.score ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{review.score}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>{review.dueDate}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedReview(review);
                        setIsReviewDetailOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Employee Goals & Objectives</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>

          <div className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription>Employee: {goal.employee}</CardDescription>
                    </div>
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Due: {goal.dueDate}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Update Progress</Button>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Templates</CardTitle>
              <CardDescription>Create and manage performance review templates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Template management features coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Performance trends and insights across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedReview && (
        <ReviewDetailModal
          isOpen={isReviewDetailOpen}
          onClose={() => setIsReviewDetailOpen(false)}
          review={selectedReview}
        />
      )}

      <StartReviewModal
        isOpen={isStartReviewOpen}
        onClose={() => setIsStartReviewOpen(false)}
        onStartReview={handleStartReview}
      />
    </div>
  );
};

export default Performance;