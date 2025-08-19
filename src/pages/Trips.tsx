import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Car, Plus, MapPin, Calendar, Clock, Filter, Search, Users, Fuel, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import TripRequestForm from "@/components/trips/TripRequestForm";
import TripStatusBadge from "@/components/trips/TripStatusBadge";
import TripDetailModal from "@/components/trips/TripDetailModal";
import { useToast, toast } from "@/hooks/use-toast";

export default function Trips() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("my-trips");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [trips, setTrips] = useState([]);

  // Fetch current user and their role
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch trips when user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchTrips();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setCurrentUser({ id: user.id, ...profile });
        setUserRole(roleData?.role || 'employee');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrips = async () => {
    try {
      let query = supabase
        .from('trip_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If not HR/Admin, only fetch user's own trips
      if (userRole !== 'hr' && userRole !== 'admin') {
        query = query.eq('requester_id', currentUser.id);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      // Transform data to match component expectations
      const transformedTrips = data?.map(trip => ({
        id: trip.id,
        projectId: trip.project_id,
        projectName: trip.project_id, // You may want to join with projects table
        donorName: "", // You may want to join with projects table
        requesterId: trip.requester_id,
        requesterName: "User", // Simplified for now
        purpose: trip.purpose,
        destination: trip.destination,
        pickupLocation: trip.pickup_location,
        dropLocation: trip.drop_location,
        startDate: trip.start_datetime ? new Date(trip.start_datetime).toISOString().split('T')[0] : "",
        endDate: trip.end_datetime ? new Date(trip.end_datetime).toISOString().split('T')[0] : "",
        startTime: trip.start_datetime ? new Date(trip.start_datetime).toTimeString().slice(0, 5) : "",
        endTime: trip.end_datetime ? new Date(trip.end_datetime).toTimeString().slice(0, 5) : "",
        passengersCount: trip.passengers_count,
        status: trip.status?.toUpperCase(),
        proposedDriverId: trip.proposed_driver_id,
        proposedVehicleId: trip.proposed_vehicle_id,
        assignedDriverId: trip.assigned_driver_id,
        assignedVehicleId: trip.assigned_vehicle_id,
        assignedDriverName: "", // Simplified for now
        assignedVehicle: "", // Simplified for now
        createdAt: trip.created_at,
        objectives: trip.objectives,
        expectedOutcomes: trip.expected_outcomes,
        termsOfReference: trip.terms_of_reference
      })) || [];

      setTrips(transformedTrips);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trip requests",
        variant: "destructive"
      });
    }
  };

  const myTrips = currentUser ? trips.filter(trip => trip.requesterId === currentUser.id) : [];
  const driverTrips = []; // TODO: Implement driver functionality

  const filteredTrips = (tripList: typeof trips) => {
    return tripList.filter(trip => {
      const matchesStatus = filterStatus === "all" || trip.status === filterStatus;
      const matchesSearch = trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  const handleCreateTrip = (tripData: any) => {
    fetchTrips(); // Refresh trips after creating
    setShowCreateDialog(false);
  };

  const handleSaveDraft = (tripData: any) => {
    fetchTrips(); // Refresh trips after saving draft
    setShowCreateDialog(false);
  };

  const getStatusCounts = (tripList: typeof trips) => {
    return {
      total: tripList.length,
      scheduled: tripList.filter(t => t.status === "SCHEDULED").length,
      pending: tripList.filter(t => ["SUBMITTED", "HR_REVIEW", "DRIVER_PENDING"].includes(t.status)).length,
      completed: tripList.filter(t => t.status === "COMPLETED").length
    };
  };

  const handleTripClick = (trip: any) => {
    setSelectedTrip(trip);
    setShowTripDetail(true);
  };

  const handleStatusUpdate = async (tripId: string, newStatus: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('trip_requests')
        .update({ 
          status: newStatus.toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Trip request status changed to ${newStatus}`,
      });

      fetchTrips(); // Refresh the list
    } catch (error) {
      console.error('Error updating trip status:', error);
      toast({
        title: "Error",
        description: "Failed to update trip status",
        variant: "destructive"
      });
    }
  };

  const renderTripTable = (tripList: typeof trips, showRequester = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trip Details</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Dates</TableHead>
          <TableHead>Driver & Vehicle</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredTrips(tripList).map((trip) => (
          <TableRow key={trip.id}>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{trip.destination}</span>
                </div>
                <p className="text-sm text-muted-foreground">{trip.purpose}</p>
                {showRequester && (
                  <p className="text-xs text-muted-foreground">By: {trip.requesterName}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <p className="font-medium text-sm">{trip.projectName}</p>
                <Badge variant="outline" className="text-xs">{trip.donorName}</Badge>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm">{new Date(trip.startDate).toLocaleDateString()}</span>
                </div>
                {trip.startDate !== trip.endDate && (
                  <p className="text-xs text-muted-foreground">
                    to {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">{trip.passengersCount} passengers</span>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {trip.assignedDriverName ? (
                  <>
                    <p className="text-sm font-medium">{trip.assignedDriverName}</p>
                    <p className="text-xs text-muted-foreground">{trip.assignedVehicle}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Pending assignment</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <TripStatusBadge status={trip.status as any} />
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleTripClick(trip)}
              >
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Trip Scheduler & Management</h1>
          <p className="text-muted-foreground">Project-based travel coordination with driver and vehicle management</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Request Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Trip Request</DialogTitle>
            </DialogHeader>
            <TripRequestForm 
              onSubmit={handleCreateTrip}
              onSaveDraft={handleSaveDraft}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-trips">My Trips</TabsTrigger>
          <TabsTrigger value="hr-inbox" disabled={!["hr", "admin"].includes(userRole)}>
            HR Inbox
          </TabsTrigger>
          <TabsTrigger value="driver-routes" disabled>
            Driver Routes (Coming Soon)
          </TabsTrigger>
        </TabsList>

        {/* My Trips Tab */}
        <TabsContent value="my-trips" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getStatusCounts(myTrips).total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{getStatusCounts(myTrips).scheduled}</div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{getStatusCounts(myTrips).pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{getStatusCounts(myTrips).completed}</div>
                <p className="text-xs text-muted-foreground">This year</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>My Trip Requests</CardTitle>
                  <CardDescription>Track your submitted and scheduled trips</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search trips..."
                      className="pl-8 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="HR_REVIEW">HR Review</SelectItem>
                      <SelectItem value="DRIVER_PENDING">Driver Pending</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderTripTable(myTrips)}
            </CardContent>
          </Card>
        </TabsContent>

      {/* HR Inbox Tab */}
        <TabsContent value="hr-inbox" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                HR Trip Review Inbox
              </CardTitle>
              <CardDescription>
                Review and approve trip requests, manage driver and vehicle assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTripTable(trips.filter(t => ["PENDING", "HR_REVIEW", "DRIVER_PENDING"].includes(t.status)), true)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Routes Tab */}
        <TabsContent value="driver-routes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-accent" />
                My Driver Assignments
              </CardTitle>
              <CardDescription>
                Trips where you are assigned as driver
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderTripTable(driverTrips)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trip Detail Modal */}
        {selectedTrip && (
          <TripDetailModal
            trip={selectedTrip}
            isOpen={showTripDetail}
            onClose={() => setShowTripDetail(false)}
            userRole={userRole}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
    </div>
  );
}