import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Plus, Trash2, Upload, FileText, X } from "lucide-react";
import { format, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateFiles, FILE_VALIDATION_CONFIGS } from "@/utils/fileValidation";

interface Asset {
  type: string;
  description: string;
  id?: string;
  condition?: string;
}

interface Attachment {
  id?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_path?: string;
  file?: File;
}

interface ExitRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

export function ExitRequestModal({ open, onOpenChange, onSubmitted }: ExitRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    resignationReason: "",
    lastWorkingDay: addWeeks(new Date(), 2), // Default to 2 weeks notice
    detailedReason: "",
    handoverNotes: "",
    outstandingTasks: "",
    contactInfo: ""
  });
  
  const [assets, setAssets] = useState<Asset[]>([
    { type: "laptop", description: "Company laptop", id: "", condition: "" },
    { type: "id_badge", description: "Employee ID badge", id: "", condition: "" },
    { type: "access_cards", description: "Office access cards", id: "", condition: "" }
  ]);

  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const resignationReasons = [
    "Better career opportunity",
    "Personal reasons",
    "Career change",
    "Relocation",
    "Family reasons",
    "Health reasons",
    "Retirement",
    "Education/Further studies",
    "Work-life balance",
    "Other"
  ];

  const addAsset = () => {
    setAssets([...assets, { type: "other", description: "", id: "", condition: "" }]);
  };

  const removeAsset = (index: number) => {
    if (assets.length > 1) {
      setAssets(assets.filter((_, i) => i !== index));
    }
  };

  const updateAsset = (index: number, field: keyof Asset, value: string) => {
    const updatedAssets = [...assets];
    updatedAssets[index] = { ...updatedAssets[index], [field]: value };
    setAssets(updatedAssets);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    
    // Validate all files at once
    const validation = validateFiles(filesArray, FILE_VALIDATION_CONFIGS.EXIT_ATTACHMENTS);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid File(s)",
        description: validation.errors.join('. '),
        variant: "destructive"
      });
      return;
    }

    // Add valid files to attachments
    filesArray.forEach(file => {
      const newAttachment: Attachment = {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file: file
      };

      setAttachments(prev => [...prev, newAttachment]);
    });

    // Reset the input
    event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!formData.resignationReason || !formData.lastWorkingDay) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error("User not authenticated");
      }

      // Create exit request
      const { data: exitRequest, error: exitError } = await supabase
        .from("exit_requests")
        .insert({
          employee_id: user.data.user.id,
          resignation_reason: formData.resignationReason,
          proposed_last_working_day: format(formData.lastWorkingDay, "yyyy-MM-dd"),
          detailed_reason: formData.detailedReason,
          handover_notes: formData.handoverNotes,
          outstanding_tasks: formData.outstandingTasks,
          contact_info_post_departure: formData.contactInfo
        })
        .select()
        .single();

      if (exitError) throw exitError;

      // Create assets records
      const assetRecords = assets
        .filter(asset => asset.description.trim())
        .map(asset => ({
          exit_request_id: exitRequest.id,
          asset_type: asset.type,
          asset_description: asset.description,
          asset_id: asset.id || null,
          condition_notes: asset.condition || null
        }));

      if (assetRecords.length > 0) {
        const { error: assetsError } = await supabase
          .from("exit_assets")
          .insert(assetRecords);

        if (assetsError) throw assetsError;
      }

      // Upload and create attachment records
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.file) {
            const fileName = `${user.data.user.id}/${exitRequest.id}/${Date.now()}_${attachment.file_name}`;
            
            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('exit-attachments')
              .upload(fileName, attachment.file);

            if (uploadError) throw uploadError;

            // Create attachment record
            const { error: attachmentError } = await supabase
              .from('exit_attachments')
              .insert({
                exit_request_id: exitRequest.id,
                file_name: attachment.file_name,
                file_path: fileName,
                file_type: attachment.file_type,
                file_size: attachment.file_size,
                uploaded_by: user.data.user.id
              });

            if (attachmentError) throw attachmentError;
          }
        }
      }

      // Create default checklist
      const { error: checklistError } = await supabase.rpc(
        "create_default_exit_checklist",
        { exit_request_id: exitRequest.id }
      );

      if (checklistError) throw checklistError;

      toast({
        title: "Success",
        description: "Exit request submitted successfully. HR will review your request.",
      });

      onSubmitted();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting exit request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit exit request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Initiate Exit Process</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="handover">Handover</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leaving *</Label>
                  <Select value={formData.resignationReason} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, resignationReason: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {resignationReasons.map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Proposed Last Working Day *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.lastWorkingDay && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.lastWorkingDay ? format(formData.lastWorkingDay, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.lastWorkingDay}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, lastWorkingDay: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="detailed-reason">Detailed Reason (Optional)</Label>
                <Textarea
                  id="detailed-reason"
                  placeholder="Please provide more details about your decision to leave..."
                  value={formData.detailedReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, detailedReason: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Asset Handover</h3>
                <Button onClick={addAsset} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </div>

              <div className="space-y-3">
                {assets.map((asset, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-xs">Asset Type</Label>
                      <Select value={asset.type} onValueChange={(value) => updateAsset(index, 'type', value)}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laptop">Laptop</SelectItem>
                          <SelectItem value="id_badge">ID Badge</SelectItem>
                          <SelectItem value="access_cards">Access Cards</SelectItem>
                          <SelectItem value="mobile_phone">Mobile Phone</SelectItem>
                          <SelectItem value="keys">Office Keys</SelectItem>
                          <SelectItem value="uniform">Uniform/Clothing</SelectItem>
                          <SelectItem value="software_license">Software License</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Asset description"
                        value={asset.description}
                        onChange={(e) => updateAsset(index, 'description', e.target.value)}
                        className="h-8"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Asset ID (Optional)</Label>
                      <Input
                        placeholder="Serial/Asset number"
                        value={asset.id || ""}
                        onChange={(e) => updateAsset(index, 'id', e.target.value)}
                        className="h-8"
                      />
                    </div>

                    <div className="flex items-end space-x-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Condition</Label>
                        <Input
                          placeholder="Good, Fair, Poor"
                          value={asset.condition || ""}
                          onChange={(e) => updateAsset(index, 'condition', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      {assets.length > 1 && (
                        <Button
                          onClick={() => removeAsset(index)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="handover" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Handover & Transition Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="handover">Current Projects & Handover Notes</Label>
                <Textarea
                  id="handover"
                  placeholder="Describe your current projects, responsibilities, and handover requirements..."
                  value={formData.handoverNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, handoverNotes: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasks">Outstanding Tasks & Commitments</Label>
                <Textarea
                  id="tasks"
                  placeholder="List any outstanding tasks, deadlines, or commitments that need attention..."
                  value={formData.outstandingTasks}
                  onChange={(e) => setFormData(prev => ({ ...prev, outstandingTasks: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Post-Departure Contact Information (Optional)</Label>
                <Input
                  id="contact"
                  placeholder="Email or phone for urgent post-departure queries"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Document Attachments</h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    variant="outline"
                    size="sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                <p>Upload your official resignation letter and any other relevant documents.</p>
                <p>Supported formats: PDF, Word documents, text files, and images (JPEG, PNG)</p>
                <p>Maximum file size: 10MB per file</p>
              </div>

              {attachments.length === 0 ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No files uploaded yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Upload Files" to add your resignation letter and supporting documents
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{attachment.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.file_size)} • {attachment.file_type}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeAttachment(index)}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-2">
            {activeTab !== "basic" && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ["basic", "assets", "handover", "attachments"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}
            {activeTab !== "attachments" && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ["basic", "assets", "handover", "attachments"];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={isSubmitting}
              >
                Next
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Exit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}