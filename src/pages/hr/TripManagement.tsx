import { useState, useEffect } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarDays, Car, Users, BarChart3, Eye, CheckCircle, XCircle, Calendar, MapPin, Clock, Plus, Edit, Trash2 } from "lucide-react";
import TripDetailModal from "@/components/trips/TripDetailModal";
import ConflictAlert from "@/components/trips/ConflictAlert";
import TripStatusBadge from "@/components/trips/TripStatusBadge";
import { AddDriverModal } from "@/components/modals/AddDriverModal";
import { AddVehicleModal } from "@/components/modals/AddVehicleModal";
import { TripCalendar } from "@/components/calendar/TripCalendar";
import { ConflictDetector } from "@/components/scheduling/ConflictDetector";
import { AutoAssignment } from "@/components/scheduling/AutoAssignment";
import { TripAnalyticsDashboard } from "@/components/analytics/TripAnalyticsDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast, toast } from "@/hooks/use-toast";

type TripStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "scheduled" 
  | "in_progress" 
  | "completed" 
  | "cancelled";

interface Conflict {
  type: "driver" | "vehicle" | "maintenance";
  message: string;
  severity: "warning" | "error";
  suggestions?: string[];
}

interface Trip {
  id: string;
  projectId: string;
  projectName: string;
  donorName: string;
  purpose: string;
  destination: string;
  pickupLocation: string;
  dropLocation: string;
  startDateTime: string;
  endDateTime: string;
  passengersCount: number;
  proposedDriverId: string;
  proposedVehicleId: string;
  assignedDriverId: string | null;
  assignedVehicleId: string | null;
  status: TripStatus;
  requesterName: string;
  requesterDepartment: string;
  termsOfReference: string;
  luggageNotes: string;
  conflicts: Conflict[];
}

// Real trip data - no mock data

export default function TripManagement() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [driverModalOpen, setDriverModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all data from database
  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch user details separately for each trip
      const tripsWithUsers = await Promise.all(
        (data || []).map(async (trip) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', trip.requester_id)
            .single();
          
          return {
            ...trip,
            requester_name: userData?.full_name || "Unknown",
            requester_email: userData?.email || ""
          };
        })
      );
      
      
      // Transform database data to component format
      const transformedTrips = tripsWithUsers.map(trip => ({
        id: trip.id,
        projectId: trip.project_id,
        projectName: trip.project_id,
        donorName: "N/A",
        purpose: trip.purpose,
        destination: trip.destination,
        pickupLocation: trip.pickup_location,
        dropLocation: trip.drop_location || trip.destination,
        startDateTime: trip.start_datetime,
        endDateTime: trip.end_datetime,
        passengersCount: trip.passengers_count,
        proposedDriverId: trip.proposed_driver_id || "",
        proposedVehicleId: trip.proposed_vehicle_id || "",
        assignedDriverId: trip.assigned_driver_id,
        assignedVehicleId: trip.assigned_vehicle_id,
        status: trip.status as TripStatus,
        requesterName: trip.requester_name,
        requesterDepartment: "N/A",
        termsOfReference: trip.terms_of_reference || "",
        luggageNotes: trip.luggage_notes || "",
        conflicts: []
      }));
      
      setTrips(transformedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({ title: "Error fetching trips", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({ title: "Error fetching drivers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('make', { ascending: true });
      
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({ title: "Error fetching vehicles", variant: "destructive" });
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);
      
      if (error) throw error;
      toast({ title: "Driver deleted successfully" });
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({ title: "Error deleting driver", variant: "destructive" });
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);
      
      if (error) throw error;
      toast({ title: "Vehicle deleted successfully" });
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({ title: "Error deleting vehicle", variant: "destructive" });
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    const matchesProject = projectFilter === "all" || trip.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusCounts = () => {
    return {
      total: trips.length,
      pending: trips.filter(t => t.status === "pending").length,
      scheduled: trips.filter(t => t.status === "approved" || t.status === "scheduled").length,
      inProgress: trips.filter(t => t.status === "in_progress").length
    };
  };

  const handleApprove = (tripId: string) => {
    console.log('Approving trip:', tripId);
  };

  const handleReject = (tripId: string) => {
    console.log('Rejecting trip:', tripId);
  };

  const statusCounts = getStatusCounts();

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold">Trip Management</h1>
          <p className="text-muted-foreground">Manage trip requests, drivers, and fleet vehicles</p>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.scheduled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.inProgress}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox">HR Inbox</TabsTrigger>
            <TabsTrigger value="drivers">Driver Management</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Management</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="scheduling">Smart Scheduling</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trip Requests</CardTitle>
                <CardDescription>Review and manage incoming trip requests</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search trips, projects, or requesters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="HR_REVIEW">HR Review</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={projectFilter} onValueChange={setProjectFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Trip Requests List */}
                {filteredTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No trip requests to review</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTrips.map((trip) => (
                      <Card key={trip.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{trip.purpose}</h3>
                                <TripStatusBadge status={trip.status} />
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{trip.destination}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(trip.startDateTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-3 w-3" />
                                  <span>{trip.requesterName} • {trip.projectName}</span>
                                </div>
                              </div>
                              {trip.conflicts.length > 0 && (
                                <ConflictAlert conflicts={trip.conflicts} />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTrip(trip)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              {trip.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(trip.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(trip.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Driver Management</CardTitle>
                  <CardDescription>Manage drivers and their availability</CardDescription>
                </div>
                <Button onClick={() => setDriverModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading drivers...</p>
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No drivers added yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>License Type</TableHead>
                        <TableHead>License Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.name}</TableCell>
                          <TableCell>{driver.phone || 'N/A'}</TableCell>
                          <TableCell>{driver.license_type || 'N/A'}</TableCell>
                          <TableCell>{driver.license_expiry || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={driver.status === 'available' ? 'secondary' : 'outline'}>
                              {driver.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingDriver(driver);
                                  setDriverModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteDriver(driver.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vehicle Management</CardTitle>
                  <CardDescription>Manage fleet vehicles and maintenance</CardDescription>
                </div>
                <Button onClick={() => setVehicleModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading vehicles...</p>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No vehicles added yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plate Number</TableHead>
                        <TableHead>Make & Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Fuel Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.plate_number}</TableCell>
                          <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                          <TableCell>{vehicle.year || 'N/A'}</TableCell>
                          <TableCell>{vehicle.capacity || 'N/A'}</TableCell>
                          <TableCell>{vehicle.fuel_type || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={vehicle.status === 'available' ? 'secondary' : 'outline'}>
                              {vehicle.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingVehicle(vehicle);
                                  setVehicleModalOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <TripCalendar />
          </TabsContent>

          <TabsContent value="scheduling">
            <div className="space-y-6">
              <ConflictDetector />
              <AutoAssignment />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <TripAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>Trip utilization and fleet performance reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Additional reports coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          isOpen={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
          userRole="hr"
        />
      )}

      <AddDriverModal
        isOpen={driverModalOpen}
        onClose={() => {
          setDriverModalOpen(false);
          setEditingDriver(null);
        }}
        onDriverAdded={fetchDrivers}
        driver={editingDriver}
      />

      <AddVehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        onVehicleAdded={fetchVehicles}
        vehicle={editingVehicle}
      />
    </HRLayout>
  );
}
