import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Star, Send } from "lucide-react";
import { supabase } from "@/lib/api";
import { toast } from "sonner";
import TaskChatModal from "./TaskChatModal";

interface TaskSubmissionDetails {
  id: string;
  task_title: string;
  task_description: string;
  priority: string;
  estimated_hours: number;
  actual_hours: number;
  completion_status: string;
  completion_percentage: number;
  notes: string;
}

interface TaskEvaluationModalProps {
  taskSubmission: TaskSubmissionDetails;
  onEvaluationComplete: () => void;
}

export default function TaskEvaluationModal({ taskSubmission, onEvaluationComplete }: TaskEvaluationModalProps) {
  const [open, setOpen] = useState(false);
  const [evaluation, setEvaluation] = useState({
    performance_score: 3,
    completion_assessment: 'completed' as 'completed' | 'partially_completed' | 'not_completed',
    feedback: '',
    requires_explanation: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);

  const handleSubmitEvaluation = async () => {
    try {
      setSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to submit evaluations');
        return;
      }

      const { data, error } = await supabase
        .from('task_evaluations')
        .insert({
          task_submission_id: taskSubmission.id,
          evaluator_id: user.id,
          performance_score: evaluation.performance_score,
          completion_assessment: evaluation.completion_assessment,
          feedback: evaluation.feedback,
          requires_explanation: evaluation.requires_explanation
        })
        .select()
        .single();

      if (error) throw error;

      if (evaluation.requires_explanation) {
        setEvaluationId(data.id);
        setShowChat(true);
      }

      toast.success('Evaluation submitted successfully');
      setOpen(false);
      onEvaluationComplete();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case 'completed': return 'default';
      case 'partially_completed': return 'default';
      case 'not_completed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Star className="h-4 w-4 mr-2" />
            Evaluate Task
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluate Task Performance</DialogTitle>
            <DialogDescription>
              Provide feedback and assessment for this task submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Task Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">{taskSubmission.task_title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{taskSubmission.task_description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Priority</div>
                  <Badge variant="outline" className="capitalize">{taskSubmission.priority}</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Estimated</div>
                  <div className="font-medium">{taskSubmission.estimated_hours}h</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Actual</div>
                  <div className="font-medium">{taskSubmission.actual_hours}h</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="font-medium">{taskSubmission.completion_percentage}%</div>
                </div>
              </div>

              {taskSubmission.notes && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Employee Notes</div>
                  <p className="text-sm">{taskSubmission.notes}</p>
                </div>
              )}
            </div>

            {/* Evaluation Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Performance Score: {evaluation.performance_score}/5</Label>
                <div className="px-3">
                  <Slider
                    value={[evaluation.performance_score]}
                    onValueChange={(value) => setEvaluation({ ...evaluation, performance_score: value[0] })}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Fair</span>
                    <span>Good</span>
                    <span>Very Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
                <div className={`text-center font-medium ${getScoreColor(evaluation.performance_score)}`}>
                  {evaluation.performance_score === 5 && "Excellent"}
                  {evaluation.performance_score === 4 && "Very Good"}
                  {evaluation.performance_score === 3 && "Good"}
                  {evaluation.performance_score === 2 && "Fair"}
                  {evaluation.performance_score === 1 && "Poor"}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Completion Assessment</Label>
                <Select
                  value={evaluation.completion_assessment}
                  onValueChange={(value: any) => setEvaluation({ ...evaluation, completion_assessment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="partially_completed">Partially Completed</SelectItem>
                    <SelectItem value="not_completed">Not Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Feedback</Label>
                <Textarea
                  value={evaluation.feedback}
                  onChange={(e) => setEvaluation({ ...evaluation, feedback: e.target.value })}
                  placeholder="Provide detailed feedback on the task performance..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={evaluation.requires_explanation}
                  onCheckedChange={(checked) => setEvaluation({ ...evaluation, requires_explanation: checked })}
                />
                <Label>Requires explanation from employee</Label>
              </div>

              {evaluation.requires_explanation && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Employee will be asked to provide additional explanation
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEvaluation}
                disabled={submitting || !evaluation.feedback.trim()}
                className="flex-1"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Evaluation
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showChat && evaluationId && (
        <TaskChatModal
          evaluationId={evaluationId}
          taskTitle={taskSubmission.task_title}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}