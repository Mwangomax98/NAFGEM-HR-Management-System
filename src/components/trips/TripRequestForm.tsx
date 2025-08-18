import { useState } from "react";
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

interface TripRequestFormProps {
  onSubmit: (trip: any) => void;
  onSaveDraft: (trip: any) => void;
  existingTrip?: any;
}

const projects = [
  { id: "proj-1", name: "Clean Water Initiative", donor: "World Bank", budget: 150000 },
  { id: "proj-2", name: "Education Support Program", donor: "USAID", budget: 250000 },
  { id: "proj-3", name: "Healthcare Access Project", donor: "EU Commission", budget: 180000 },
];

const drivers = [
  { id: "drv-1", name: "James Mwangi", license: "Class B", homeBase: "Nairobi", availability: "available" },
  { id: "drv-2", name: "Sarah Kamau", license: "Class A", homeBase: "Mombasa", availability: "busy" },
  { id: "drv-3", name: "Peter Ochieng", license: "Class B", homeBase: "Kisumu", availability: "available" },
];

const vehicles = [
  { id: "veh-1", plate: "KCA 123A", type: "Toyota Hilux", capacity: 5, fuel: "Diesel", status: "available" },
  { id: "veh-2", plate: "KBA 456B", type: "Mitsubishi L200", capacity: 4, fuel: "Petrol", status: "maintenance" },
  { id: "veh-3", plate: "KAA 789C", type: "Toyota Land Cruiser", capacity: 7, fuel: "Diesel", status: "available" },
];

export default function TripRequestForm({ onSubmit, onSaveDraft, existingTrip }: TripRequestFormProps) {
  const [formData, setFormData] = useState({
    projectId: existingTrip?.projectId || "",
    purpose: existingTrip?.purpose || "",
    destination: existingTrip?.destination || "",
    pickupLocation: existingTrip?.pickupLocation || "",
    dropLocation: existingTrip?.dropLocation || "",
    startDate: existingTrip?.startDate ? new Date(existingTrip.startDate) : null,
    endDate: existingTrip?.endDate ? new Date(existingTrip.endDate) : null,
    startTime: existingTrip?.startTime || "09:00",
    endTime: existingTrip?.endTime || "17:00",
    passengersCount: existingTrip?.passengersCount || 1,
    luggageNotes: existingTrip?.luggageNotes || "",
    proposedDriverId: existingTrip?.proposedDriverId || "",
    proposedVehicleId: existingTrip?.proposedVehicleId || "",
    termsOfReference: existingTrip?.termsOfReference || "",
    objectives: existingTrip?.objectives || "",
    expectedOutcomes: existingTrip?.expectedOutcomes || "",
  });

  const [conflicts, setConflicts] = useState<string[]>([]);

  const checkConflicts = () => {
    const newConflicts = [];
    
    const selectedDriver = drivers.find(d => d.id === formData.proposedDriverId);
    const selectedVehicle = vehicles.find(v => v.id === formData.proposedVehicleId);
    
    if (selectedDriver?.availability === "busy") {
      newConflicts.push(`Driver ${selectedDriver.name} may not be available`);
    }
    
    if (selectedVehicle?.status === "maintenance") {
      newConflicts.push(`Vehicle ${selectedVehicle.plate} is in maintenance`);
    }
    
    setConflicts(newConflicts);
  };

  const handleSubmit = (isDraft = false) => {
    const tripData = {
      ...formData,
      id: existingTrip?.id || `trip-${Date.now()}`,
      status: isDraft ? "DRAFT" : "SUBMITTED",
      requesterId: "emp-1", // Mock current user
      requesterName: "John Doe",
      createdAt: new Date().toISOString(),
      projectName: projects.find(p => p.id === formData.projectId)?.name || "",
      donorName: projects.find(p => p.id === formData.projectId)?.donor || "",
    };

    if (isDraft) {
      onSaveDraft(tripData);
    } else {
      onSubmit(tripData);
    }
  };

  const selectedProject = projects.find(p => p.id === formData.projectId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-heading text-primary">
            {existingTrip ? "Edit Trip Request" : "New Trip Request"}
          </CardTitle>
          <CardDescription>
            Plan your project-related travel with driver and vehicle coordination
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project" className="text-sm font-medium">
              Project <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.projectId} onValueChange={(value) => setFormData({...formData, projectId: value})}>
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
                  <span className="text-sm text-muted-foreground">
                    Budget: ${selectedProject.budget.toLocaleString()}
                  </span>
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
                placeholder="e.g., Site visit, Training, Meeting"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination <span className="text-destructive">*</span></Label>
              <Input
                id="destination"
                placeholder="e.g., Mombasa, Kenya"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
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
                  placeholder="Office/Hotel address"
                  className="pl-10"
                  value={formData.pickupLocation}
                  onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="drop">Drop Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="drop"
                  placeholder="Return location"
                  className="pl-10"
                  value={formData.dropLocation}
                  onChange={(e) => setFormData({...formData, dropLocation: e.target.value})}
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
                  max="10"
                  className="pl-10"
                  value={formData.passengersCount}
                  onChange={(e) => setFormData({...formData, passengersCount: parseInt(e.target.value)})}
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
              />
            </div>
          </div>

          {/* Driver & Vehicle Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Proposed Driver</Label>
              <Select value={formData.proposedDriverId} onValueChange={(value) => {
                setFormData({...formData, proposedDriverId: value});
                setTimeout(checkConflicts, 100);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{driver.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {driver.license} • {driver.homeBase}
                          </span>
                        </div>
                        <Badge 
                          variant={driver.availability === "available" ? "default" : "destructive"}
                          className="ml-2"
                        >
                          {driver.availability}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Proposed Vehicle</Label>
              <Select value={formData.proposedVehicleId} onValueChange={(value) => {
                setFormData({...formData, proposedVehicleId: value});
                setTimeout(checkConflicts, 100);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span className="font-medium">{vehicle.plate}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {vehicle.type} • {vehicle.capacity} seats • {vehicle.fuel}
                          </span>
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
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              className="flex-1"
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              className="flex-1"
              disabled={!formData.projectId || !formData.purpose || !formData.startDate}
            >
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}