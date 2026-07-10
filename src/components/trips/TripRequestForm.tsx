import { useState, useEffect } from "react";
import { supabase } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, AlertTriangle, Users, MapPin, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast, toast } from "@/hooks/use-toast";
import { checkRateLimit, RATE_LIMITS, getRateLimitResetTime } from "@/utils/rateLimiter";
import { logRateLimitExceeded, logTripCreated, logTripUpdated } from "@/utils/auditLogger";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TripRequestFormProps {
  onSubmit: (trip: any) => void;
  onSaveDraft: (trip: any) => void;
  existingTrip?: any;
}


export default function TripRequestForm({ onSubmit, onSaveDraft, existingTrip }: TripRequestFormProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTrips, setDuplicateTrips] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    projectId: existingTrip?.projectId || "",
    purpose: existingTrip?.purpose || "",
    destination: existingTrip?.destination || "",
    pickupLocation: existingTrip?.pickupLocation || "",
    dropLocation: existingTrip?.dropLocation || "",
    startDate: existingTrip?.startDate ? new Date(existingTrip.startDate) : null,
    endDate: existingTrip?.endDate ? new Date(existingTrip.endDate) : null,
    startTime: existingTrip?.startTime || "",
    endTime: existingTrip?.endTime || "",
    passengersCount: existingTrip?.passengersCount || 1,
    luggageNotes: existingTrip?.luggageNotes || "",
    proposedDriverId: existingTrip?.proposedDriverId || "",
    proposedVehicleId: existingTrip?.proposedVehicleId || "",
    termsOfReference: existingTrip?.termsOfReference || "",
    objectives: existingTrip?.objectives || "",
    expectedOutcomes: existingTrip?.expectedOutcomes || "",
  });

  const [conflicts, setConflicts] = useState<string[]>([]);

  // Fetch current user and load data
  useEffect(() => {
    fetchCurrentUser();
    fetchProjects();
    fetchDriversAndVehicles();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser({ id: user.id, ...profile });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Authentication Error",
        description: "Please sign in to create trip requests",
        variant: "destructive"
      });
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error loading projects",
        description: "Unable to load project data",
        variant: "destructive"
      });
    }
  };

  const fetchDriversAndVehicles = async () => {
    try {
      const [driversResponse, vehiclesResponse] = await Promise.all([
        supabase.from('drivers').select('*').eq('availability', true).order('name'),
        supabase.from('vehicles').select('*').eq('availability', true).order('make')
      ]);

      if (driversResponse.data) {
        setDrivers(driversResponse.data.map(driver => ({
          id: driver.id,
          name: driver.name,
          status: driver.status
        })));
      }

      if (vehiclesResponse.data) {
        setVehicles(vehiclesResponse.data.map(vehicle => ({
          id: vehicle.id,
          name: `${vehicle.make} ${vehicle.model} (${vehicle.plate_number})`,
          status: vehicle.status,
          capacity: vehicle.capacity
        })));
      }
    } catch (error) {
      console.error('Error fetching drivers and vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = () => {
    const newConflicts = [];
    
    const selectedDriver = drivers.find(d => d.id === formData.proposedDriverId);
    const selectedVehicle = vehicles.find(v => v.id === formData.proposedVehicleId);
    
    if (selectedDriver?.status === "busy") {
      newConflicts.push(`Driver ${selectedDriver.name} may not be available`);
    }
    
    if (selectedVehicle?.status === "maintenance") {
      newConflicts.push(`Vehicle ${selectedVehicle.name} is in maintenance`);
    }
    
    setConflicts(newConflicts);
  };

  // Check for conflicts and validation when form data changes
  useEffect(() => {
    checkConflicts();
    validateForm(true);
  }, [formData.proposedDriverId, formData.proposedVehicleId, formData]);

  const validateForm = (isDraft = false) => {
    const errors = [];
    
    if (!isDraft) {
      if (!formData.projectId) errors.push("Project is required");
      if (!formData.purpose) errors.push("Purpose is required");
      if (!formData.destination) errors.push("Destination is required");
      if (!formData.startDate) errors.push("Start date is required");
      if (!formData.endDate) errors.push("End date is required");
      if (!formData.objectives) errors.push("Objectives are required");
      if (!formData.expectedOutcomes) errors.push("Expected outcomes are required");
      
      // Prevent past-date trips (Fix #2)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (formData.startDate && formData.startDate < today) {
        errors.push("Start date cannot be in the past");
      }
      
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        errors.push("End date must be after start date");
      }
      
      // Maximum trip duration validation (30 days for NGO context)
      if (formData.startDate && formData.endDate) {
        const durationDays = Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (durationDays > 30) {
          errors.push("Trip duration cannot exceed 30 days. Please split into multiple trips.");
        }
      }
      
      if (formData.passengersCount < 1) {
        errors.push("At least 1 passenger is required");
      }
      
      // Maximum passenger validation
      if (formData.passengersCount > 50) {
        errors.push("Passenger count cannot exceed 50. For larger groups, please submit multiple trips.");
      }
      
      const selectedVehicle = vehicles.find(v => v.id === formData.proposedVehicleId);
      if (selectedVehicle && selectedVehicle.capacity && formData.passengersCount > selectedVehicle.capacity) {
        errors.push(`Vehicle capacity (${selectedVehicle.capacity}) exceeded by passenger count`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Check for duplicate trips (Fix #4)
  const checkDuplicateTrips = async () => {
    if (!formData.startDate || !currentUser) return [];
    
    try {
      const startDateTime = formData.startDate && formData.startTime
        ? new Date(`${format(formData.startDate, 'yyyy-MM-dd')}T${formData.startTime}`)
        : formData.startDate;
      
      const oneDayBefore = new Date(startDateTime);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      const oneDayAfter = new Date(startDateTime);
      oneDayAfter.setDate(oneDayAfter.getDate() + 1);

      const { data, error } = await supabase
        .from('trip_requests')
        .select('id, purpose, destination, start_datetime, status')
        .eq('requester_id', currentUser.id)
        .eq('destination', formData.destination)
        .gte('start_datetime', oneDayBefore.toISOString())
        .lte('start_datetime', oneDayAfter.toISOString())
        .not('status', 'in', '(rejected,cancelled)');
      
      if (error) throw error;
      
      // Filter out the current trip if editing
      return (data || []).filter(trip => trip.id !== existingTrip?.id);
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return [];
    }
  };

  const handleSubmit = async (isDraft = false) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create trip requests",
        variant: "destructive"
      });
      return;
    }

    if (!validateForm(isDraft)) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before submitting",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate trips (Fix #4)
    if (!isDraft && !existingTrip) {
      const duplicates = await checkDuplicateTrips();
      if (duplicates.length > 0) {
        setDuplicateTrips(duplicates);
        setDuplicateDialogOpen(true);
        return;
      }
    }

    await proceedWithSubmit(isDraft);
  };

  const proceedWithSubmit = async (isDraft = false) => {
    // Check rate limit (only for submissions, not drafts)
    if (!isDraft) {
      const rateLimitKey = `trip-request-${currentUser.id}`;
      if (!checkRateLimit(rateLimitKey, RATE_LIMITS.TRIP_REQUEST)) {
        const resetTime = getRateLimitResetTime(rateLimitKey);
        const minutes = Math.ceil(resetTime / 60000);
        
        await logRateLimitExceeded('trip_request');
        
        toast({
          title: "Too Many Requests",
          description: `Please wait ${minutes} minutes before submitting another trip request.`,
          variant: "destructive"
        });
        return;
      }
    }

    setSaving(true);
    
    try {
      const startDateTime = formData.startDate && formData.startTime
        ? new Date(`${format(formData.startDate, 'yyyy-MM-dd')}T${formData.startTime}`)
        : null;
      
      const endDateTime = formData.endDate && formData.endTime
        ? new Date(`${format(formData.endDate, 'yyyy-MM-dd')}T${formData.endTime}`)
        : null;

      const tripData = {
        project_id: formData.projectId,
        purpose: formData.purpose,
        destination: formData.destination,
        pickup_location: formData.pickupLocation,
        drop_location: formData.dropLocation,
        start_datetime: startDateTime?.toISOString(),
        end_datetime: endDateTime?.toISOString(),
        passengers_count: formData.passengersCount,
        luggage_notes: formData.luggageNotes,
        proposed_driver_id: formData.proposedDriverId || null,
        proposed_vehicle_id: formData.proposedVehicleId || null,
        objectives: formData.objectives,
        expected_outcomes: formData.expectedOutcomes,
        terms_of_reference: formData.termsOfReference,
        status: isDraft ? "pending" : "pending", // All start as pending for HR review
        requester_id: currentUser.id,
      };

      let result;
      if (existingTrip?.id) {
        const { data, error } = await supabase
          .from('trip_requests')
          .update(tripData)
          .eq('id', existingTrip.id)
          .select()
          .single();
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('trip_requests')
          .insert([tripData])
          .select()
          .single();
        result = { data, error };
      }

      if (result.error) {
        throw result.error;
      }

      // Audit logging (Fix #3)
      if (existingTrip?.id) {
        await logTripUpdated(existingTrip.id, Object.keys(formData));
      } else {
        await logTripCreated(result.data.id, {
          destination: formData.destination,
          purpose: formData.purpose,
          project_id: formData.projectId,
        });
      }

      toast({
        title: isDraft ? "Draft Saved" : "Trip Request Submitted",
        description: isDraft 
          ? "Your trip request has been saved as a draft"
          : "Your trip request has been submitted for supervisor review",
      });

      onSubmit(result.data);
      
    } catch (error) {
      console.error('Error saving trip request:', error);
      toast({
        title: "Error",
        description: "Failed to save trip request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  // Fix #1: Check if trip is editable (only pending trips can be edited)
  const isEditable = !existingTrip || existingTrip.status === 'pending' || existingTrip.status === 'draft';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Fix #1: Show read-only message for non-editable trips */}
      {existingTrip && !isEditable && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This trip request cannot be edited as it has been <strong>{existingTrip.status}</strong>. 
            Only pending trips can be modified.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-heading text-primary">
            {existingTrip ? (isEditable ? "Edit Trip Request" : "View Trip Request") : "New Trip Request"}
          </CardTitle>
          <CardDescription>
            {isEditable 
              ? "Plan your project-related travel with driver and vehicle coordination"
              : "Trip request details (read-only)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium">
              Project <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.projectId} 
              onValueChange={(value) => setFormData({...formData, projectId: value})}
              disabled={!isEditable}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-xs text-muted-foreground">Donor: {project.donor}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="mt-2 p-3 bg-accent/10 rounded-md">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedProject.donor}</Badge>
                </div>
              </div>
            )}
          </div>

          {/* Purpose & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose <span className="text-destructive">*</span></Label>
                <Input
                  id="purpose"
                  placeholder="Purpose of trip"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  disabled={!isEditable}
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination <span className="text-destructive">*</span></Label>
                <Input
                  id="destination"
                  placeholder="Destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  disabled={!isEditable}
                />
            </div>
          </div>

          {/* Pickup & Drop Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pickup">Pickup Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickup"
                    placeholder="Pickup location"
                    className="pl-10"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                    disabled={!isEditable}
                  />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drop">Drop Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="drop"
                    placeholder="Drop location"
                    className="pl-10"
                    value={formData.dropLocation}
                    onChange={(e) => setFormData({...formData, dropLocation: e.target.value})}
                    disabled={!isEditable}
                  />
              </div>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date & Time <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({...formData, startDate: date})}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return !isEditable || date < today;
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  className="w-32"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  disabled={!isEditable}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Date & Time <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({...formData, endDate: date})}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  className="w-32"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  disabled={!isEditable}
                />
              </div>
            </div>
          </div>

          {/* Passengers & Luggage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengers">Number of Passengers</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  max="50"
                  className="pl-10"
                  value={formData.passengersCount}
                  onChange={(e) => setFormData({...formData, passengersCount: parseInt(e.target.value)})}
                  disabled={!isEditable}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="luggage">Luggage Notes</Label>
              <Input
                id="luggage"
                placeholder="Special luggage requirements"
                value={formData.luggageNotes}
                onChange={(e) => setFormData({...formData, luggageNotes: e.target.value})}
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Driver & Vehicle Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proposed Driver</Label>
              <Select 
                value={formData.proposedDriverId} 
                onValueChange={(value) => {
                  setFormData({...formData, proposedDriverId: value});
                  setTimeout(checkConflicts, 100);
                }}
                disabled={!isEditable}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{driver.name}</span>
                        </div>
                        <Badge 
                          variant={driver.status === "available" ? "default" : "destructive"}
                          className="ml-2"
                        >
                          {driver.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proposed Vehicle</Label>
              <Select 
                value={formData.proposedVehicleId} 
                onValueChange={(value) => {
                  setFormData({...formData, proposedVehicleId: value});
                  setTimeout(checkConflicts, 100);
                }}
                disabled={!isEditable}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{vehicle.name}</span>
                        </div>
                        <Badge 
                          variant={vehicle.status === "available" ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Please fix the following errors:</p>
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-sm">• {error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Conflict Warnings */}
          {conflicts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Potential conflicts detected:</p>
                  {conflicts.map((conflict, index) => (
                    <p key={index} className="text-sm">• {conflict}</p>
                  ))}
                  <p className="text-sm text-muted-foreground mt-2">
                    HR will review and suggest alternatives if needed.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Terms of Reference */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-heading font-medium">Terms of Reference</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="objectives">Objectives <span className="text-destructive">*</span></Label>
              <Textarea
                id="objectives"
                placeholder="What are the main objectives of this trip?"
                rows={3}
                value={formData.objectives}
                onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                disabled={!isEditable}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outcomes">Expected Outcomes <span className="text-destructive">*</span></Label>
              <Textarea
                id="outcomes"
                placeholder="What outcomes do you expect to achieve?"
                rows={3}
                value={formData.expectedOutcomes}
                onChange={(e) => setFormData({...formData, expectedOutcomes: e.target.value})}
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Actions */}
          {isEditable && (
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={saving || !currentUser}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save as Draft"}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={saving || !currentUser || validationErrors.length > 0}
                className="flex-1"
              >
                {saving ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Trip Warning Dialog (Fix #4) */}
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Similar Trip Request Found</AlertDialogTitle>
            <AlertDialogDescription>
              You have {duplicateTrips.length} similar trip request(s) to the same destination around the same dates:
              <ul className="mt-2 space-y-1">
                {duplicateTrips.map((trip) => (
                  <li key={trip.id} className="text-sm">
                    • {trip.purpose} - {new Date(trip.start_datetime).toLocaleDateString()} ({trip.status})
                  </li>
                ))}
              </ul>
              <p className="mt-3">Do you still want to create this trip request?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setDuplicateDialogOpen(false);
              proceedWithSubmit(false);
            }}>
              Yes, Create Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}