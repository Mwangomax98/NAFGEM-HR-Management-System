import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format, addWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  type: string;
  description: string;
  id?: string;
  condition?: string;
}

interface ExitRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

export function ExitRequestModal({ open, onOpenChange, onSubmitted }: ExitRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    resignationReason: "",
    lastWorkingDay: addWeeks(new Date(), 2), // Default to 2 weeks notice
    detailedReason: "",
    handoverNotes: "",
    replacementSuggestions: "",
    outstandingTasks: "",
    contactInfo: ""
  });
  
  const [assets, setAssets] = useState<Asset[]>([
    { type: "laptop", description: "Company laptop", id: "", condition: "" },
    { type: "id_badge", description: "Employee ID badge", id: "", condition: "" },
    { type: "access_cards", description: "Office access cards", id: "", condition: "" }
  ]);

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
          replacement_suggestions: formData.replacementSuggestions,
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

        <div className="space-y-6">
          {/* Basic Information */}
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

          {/* Asset Handover */}
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

          {/* Additional Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Handover & Transition Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="handover">Current Projects & Handover Notes</Label>
              <Textarea
                id="handover"
                placeholder="Describe your current projects, responsibilities, and handover requirements..."
                value={formData.handoverNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, handoverNotes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="replacement">Replacement Suggestions</Label>
              <Textarea
                id="replacement"
                placeholder="Suggest potential internal candidates or recommendations for your replacement..."
                value={formData.replacementSuggestions}
                onChange={(e) => setFormData(prev => ({ ...prev, replacementSuggestions: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tasks">Outstanding Tasks & Commitments</Label>
              <Textarea
                id="tasks"
                placeholder="List any outstanding tasks, deadlines, or commitments that need attention..."
                value={formData.outstandingTasks}
                onChange={(e) => setFormData(prev => ({ ...prev, outstandingTasks: e.target.value }))}
                rows={3}
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
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Exit Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}