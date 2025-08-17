import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Upload, Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  contactAddress: z.string().min(5, "Address is required"),
  mobilePhone: z.string().min(10, "Valid mobile number is required"),
  designation: z.string().min(2, "Designation is required"),
  placeOfWork: z.string().min(2, "Place of work is required"),
  projects: z.array(z.string()).min(1, "At least one project must be selected"),
  dateOfAppointment: z.date({
    required_error: "Date of appointment is required",
  }),
  leaveType: z.string().min(1, "Leave type is required"),
  numberOfDays: z.number().min(1, "Number of days must be at least 1"),
  fromDate: z.date({
    required_error: "Start date is required",
  }),
  toDate: z.date({
    required_error: "End date is required",
  }),
  handoverDetails: z.string().min(10, "Handover details must be at least 10 characters"),
  replacementPerson: z.string().min(2, "Replacement person is required"),
});

const leaveTypes = [
  { value: "annual", label: "Annual Leave", entitlement: 25 },
  { value: "maternity", label: "Maternity Leave", entitlement: 90 },
  { value: "paternity", label: "Paternity Leave", entitlement: 10 },
  { value: "sick", label: "Sick Leave", entitlement: 15 },
  { value: "adoption", label: "Adoption Leave", entitlement: 30 },
  { value: "compassionate", label: "Compassionate Leave", entitlement: 5 },
  { value: "personal", label: "Personal Day", entitlement: 5 },
];

const projects = [
  "USAID Health Systems Strengthening",
  "EU Education Reform Project",
  "DFID Governance Initiative",
  "World Bank Infrastructure Development",
  "UN Women Empowerment Program",
  "Gates Foundation Nutrition Project",
];

const mockLeaveBalance = {
  annual: { used: 8, total: 25 },
  maternity: { used: 0, total: 90 },
  paternity: { used: 0, total: 10 },
  sick: { used: 3, total: 15 },
  adoption: { used: 0, total: 30 },
  compassionate: { used: 1, total: 5 },
  personal: { used: 2, total: 5 },
};

export default function LeaveRequestForm() {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeName: "Sarah Johnson",
      contactAddress: "123 Main Street, Cityville",
      mobilePhone: "+1 234 567 8900",
      designation: "Senior Program Manager",
      placeOfWork: "Head Office",
      projects: [],
      numberOfDays: 1,
      handoverDetails: "",
      replacementPerson: "",
    },
  });

  const selectedLeaveType = form.watch("leaveType");
  const numberOfDays = form.watch("numberOfDays");
  
  const currentBalance = selectedLeaveType ? mockLeaveBalance[selectedLeaveType as keyof typeof mockLeaveBalance] : null;
  const remainingDays = currentBalance ? currentBalance.total - currentBalance.used - numberOfDays : 0;

  const generateRefNumber = () => {
    return `LV-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  const handleProjectToggle = (project: string) => {
    const updated = selectedProjects.includes(project)
      ? selectedProjects.filter(p => p !== project)
      : [...selectedProjects, project];
    setSelectedProjects(updated);
    form.setValue("projects", updated);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles([...attachedFiles, ...files]);
  };

  const onSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your leave request has been saved as draft.",
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const refNumber = generateRefNumber();
    console.log("Leave request submitted:", { refNumber, ...values });
    toast({
      title: "Leave Request Submitted",
      description: `Your request ${refNumber} has been submitted for approval.`,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Leave Request Form</h1>
          <p className="text-muted-foreground">Submit your leave request for approval</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          Ref: {generateRefNumber()}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Section A - Employee Information */}
          <Card className="shadow-card">
            <CardHeader className="bg-gradient-primary text-primary-foreground">
              <CardTitle className="text-xl font-heading">Section A - Employee Information</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Basic employee details and assignment information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mobilePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactAddress"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Contact Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation/Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placeOfWork"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place of Work</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfAppointment"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Appointment</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Project(s) Assignment</FormLabel>
                <FormDescription>Select all projects you are currently assigned to</FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {projects.map((project) => (
                    <div
                      key={project}
                      onClick={() => handleProjectToggle(project)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedProjects.includes(project)
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-background hover:bg-muted border-border"
                      )}
                    >
                      <span className="text-sm font-medium">{project}</span>
                    </div>
                  ))}
                </div>
                {selectedProjects.length === 0 && (
                  <p className="text-sm text-destructive mt-1">At least one project must be selected</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section B - Leave Details */}
          <Card className="shadow-card">
            <CardHeader className="bg-accent text-accent-foreground">
              <CardTitle className="text-xl font-heading">Section B - Leave Details</CardTitle>
              <CardDescription className="text-accent-foreground/80">
                Specify your leave requirements and dates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="leaveType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label} ({type.entitlement} days)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Days Requested</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>From Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick start date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>To Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick end date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {currentBalance && (
                <Card className="bg-muted p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Leave Balance</p>
                      <p className="text-sm text-muted-foreground">
                        Used: {currentBalance.used} | Total: {currentBalance.total}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-bold",
                        remainingDays < 0 ? "text-destructive" : "text-accent"
                      )}>
                        {remainingDays} days remaining
                      </p>
                      {remainingDays < 0 && (
                        <p className="text-xs text-destructive">Exceeds available balance</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <FormField
                control={form.control}
                name="handoverDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Handover Details (Mandatory)</FormLabel>
                    <FormDescription>
                      Describe how your responsibilities will be handled during your absence
                    </FormDescription>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Detail your handover arrangements, pending tasks, and any special instructions..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="replacementPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replacement Person</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Name of person covering your duties" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Supporting Documents</FormLabel>
                <FormDescription>
                  Upload any supporting documents (medical certificates, travel itineraries, etc.)
                </FormDescription>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="outline" className="cursor-pointer" asChild>
                      <div>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Files
                      </div>
                    </Button>
                  </label>
                  {attachedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachedFiles.map((file, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          📎 {file.name}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onSaveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}