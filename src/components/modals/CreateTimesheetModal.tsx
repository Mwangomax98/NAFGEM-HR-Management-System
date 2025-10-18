import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CalendarIcon, X, FileText, Clock, Send } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimesheetEntry {
  date: Date;
  project: string;
  hours: number;
  description: string;
}

interface CreateTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTimesheetModal({ isOpen, onClose, onSuccess }: CreateTimesheetModalProps) {
  const [weekStartDate, setWeekStartDate] = useState<Date | undefined>();
  const [weekEndDate, setWeekEndDate] = useState<Date | undefined>();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    if (weekStartDate) {
      const start = startOfWeek(weekStartDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      setWeekStartDate(start);
      setWeekEndDate(end);
      
      // Initialize entries for the week
      const weekEntries: TimesheetEntry[] = [];
      for (let i = 0; i < 5; i++) {
        weekEntries.push({
          date: addDays(start, i),
          project: "",
          hours: 0,
          description: ""
        });
      }
      setEntries(weekEntries);
    }
  }, [weekStartDate]);

  const handleEntryChange = (index: number, field: keyof TimesheetEntry, value: string | number) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      const isValidType = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);
      
      if (!isValidSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!isValidType) {
        toast.error(`File ${file.name} has an unsupported format.`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotalHours = () => {
    return entries.reduce((total, entry) => total + (entry.hours || 0), 0);
  };

  const calculateOvertimeHours = () => {
    const total = calculateTotalHours();
    return Math.max(0, total - 40);
  };

  const handleSubmit = async () => {
    if (!weekStartDate || !weekEndDate) {
      toast.error("Please select a week");
      return;
    }

    const validEntries = entries.filter(entry => 
      entry.project.trim() && entry.hours > 0
    );

    if (validEntries.length === 0) {
      toast.error("Please add at least one timesheet entry");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const totalHours = calculateTotalHours();
      const overtimeHours = calculateOvertimeHours();

      // Create timesheet
      const { data: timesheet, error: timesheetError } = await supabase
        .from('timesheets')
        .insert({
          employee_id: user.id,
          week_start_date: format(weekStartDate, 'yyyy-MM-dd'),
          week_end_date: format(weekEndDate, 'yyyy-MM-dd'),
          total_hours: totalHours,
          overtime_hours: overtimeHours,
          status: 'pending',
          submitted_at: new Date().toISOString(),
          notes
        })
        .select()
        .single();

      if (timesheetError) throw timesheetError;

      // Create timesheet entries
      const entriesData = validEntries.map(entry => ({
        timesheet_id: timesheet.id,
        entry_date: format(entry.date, 'yyyy-MM-dd'),
        project_name: entry.project,
        hours_worked: entry.hours,
        description: entry.description
      }));

      const { error: entriesError } = await supabase
        .from('timesheet_entries')
        .insert(entriesData);

      if (entriesError) throw entriesError;

      // Upload attachments
      for (const file of attachments) {
        const fileName = `${user.id}/${timesheet.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('timesheet-attachments')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          continue;
        }

        // Record attachment in database
        await supabase
          .from('timesheet_attachments')
          .insert({
            timesheet_id: timesheet.id,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type,
            uploaded_by: user.id
          });
      }

      toast.success("Timesheet submitted successfully! It has been sent to HR for review.");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error submitting timesheet:', error);
      toast.error(error.message || "Failed to submit timesheet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setWeekStartDate(undefined);
    setWeekEndDate(undefined);
    setEntries([]);
    setAttachments([]);
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Create New Timesheet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Week Selection */}
          <div className="space-y-2">
            <Label>Select Week</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !weekStartDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {weekStartDate && weekEndDate
                    ? `${format(weekStartDate, "MMM dd")} - ${format(weekEndDate, "MMM dd, yyyy")}`
                    : "Pick a week"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={weekStartDate}
                  onSelect={(date) => {
                    setWeekStartDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Daily Entries */}
          {entries.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Daily Time Entries</h3>
              {entries.map((entry, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {format(entry.date, 'EEEE, MMMM dd')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pointer-events-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Project</Label>
                        <Input
                          placeholder="Project name"
                          value={entry.project}
                          onChange={(e) => handleEntryChange(index, 'project', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hours</Label>
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.25"
                          placeholder="0"
                          value={entry.hours || ""}
                          onChange={(e) => handleEntryChange(index, 'hours', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tasks Performed (one per line)</Label>
                      <Textarea
                        placeholder="• Task 1&#10;• Task 2&#10;• Task 3"
                        value={entry.description}
                        onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Week Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Total Hours</Label>
                    <p className="text-2xl font-bold">{calculateTotalHours()}h</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Overtime Hours</Label>
                    <p className="text-2xl font-bold">{calculateOvertimeHours()}h</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Attachments */}
          <div className="space-y-3">
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Click to upload files or drag and drop
                  <br />
                  <span className="text-xs">PDF, DOC, JPG, PNG (max 10MB each)</span>
                </p>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (Optional)</Label>
            <Textarea
              placeholder="Any additional information about this timesheet..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !weekStartDate || calculateTotalHours() === 0}
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit to HR
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}