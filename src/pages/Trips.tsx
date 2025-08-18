import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Car, Plus, MapPin, Calendar, Clock, Filter, Search, Users, Fuel, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";
import TripRequestForm from "@/components/trips/TripRequestForm";
import TripStatusBadge from "@/components/trips/TripStatusBadge";
import TripDetailModal from "@/components/trips/TripDetailModal";

export default function Trips() {
  const [currentUser] = useState({
    id: "emp-1",
    name: "John Doe",
    role: "Employee",
    isDriver: false
  });

  const [activeTab, setActiveTab] = useState("my-trips");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [trips, setTrips] = useState([
    {
      id: "trip-1",
      projectId: "proj-1",
      projectName: "Clean Water Initiative",
      donorName: "World Bank",
      requesterId: "emp-1",
      requesterName: "John Doe",
      purpose: "Site inspection and community meeting",
      destination: "Mombasa, Kenya",
      pickupLocation: "Nairobi Office",
      dropLocation: "Nairobi Office",
      startDate: "2024-12-15",
      endDate: "2024-12-16",
      startTime: "09:00",
      endTime: "17:00",
      passengersCount: 3,
      status: "SCHEDULED",
      proposedDriverId: "drv-1",
      proposedVehicleId: "veh-1",
      assignedDriverId: "drv-1",
      assignedVehicleId: "veh-1",
      assignedDriverName: "James Mwangi",
      assignedVehicle: "KCA 123A Toyota Hilux",
      createdAt: "2024-12-01T10:00:00Z",
      objectives: "Assess water system installation progress and meet with community leaders",
      expectedOutcomes: "Updated project timeline and community feedback report"
    },
    {
      id: "trip-2",
      projectId: "proj-2",
      projectName: "Education Support Program",
      donorName: "USAID",
      requesterId: "emp-2",
      requesterName: "Jane Smith",
      purpose: "Training delivery",
      destination: "Kisumu, Kenya",
      startDate: "2024-12-10",
      endDate: "2024-12-11",
      passengersCount: 2,
      status: "HR_REVIEW",
      proposedDriverId: "drv-3",
      proposedVehicleId: "veh-3",
      createdAt: "2024-11-28T14:30:00Z"
    },
    {
      id: "trip-3",
      projectId: "proj-1",
      projectName: "Clean Water Initiative", 
      donorName: "World Bank",
      requesterId: "emp-1",
      requesterName: "John Doe",
      purpose: "Equipment delivery",
      destination: "Nakuru, Kenya",
      startDate: "2024-11-25",
      endDate: "2024-11-25",
      passengersCount: 1,
      status: "COMPLETED",
      assignedDriverId: "drv-2",
      assignedVehicleId: "veh-2",
      assignedDriverName: "Sarah Kamau",
      assignedVehicle: "KBA 456B Mitsubishi L200",
      createdAt: "2024-11-20T09:15:00Z"
    }
  ]);

  const myTrips = trips.filter(trip => trip.requesterId === currentUser.id);
  const driverTrips = currentUser.isDriver ? trips.filter(trip => 
    trip.assignedDriverId === currentUser.id || trip.proposedDriverId === currentUser.id
  ) : [];

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
    setTrips(prev => [...prev, tripData]);
    setShowCreateDialog(false);
  };

  const handleSaveDraft = (tripData: any) => {
    setTrips(prev => [...prev, tripData]);
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

  const handleStatusUpdate = (tripId: string, newStatus: string, reason?: string) => {
    setTrips(prev => prev.map(trip => 
      trip.id === tripId 
        ? { ...trip, status: newStatus, lastUpdated: new Date().toISOString() }
        : trip
    ));
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
          <TabsTrigger value="hr-inbox" disabled={!["HR", "Admin"].includes(currentUser.role)}>
            HR Inbox
          </TabsTrigger>
          <TabsTrigger value="driver-routes" disabled={!currentUser.isDriver}>
            Driver Routes
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
              {renderTripTable(trips.filter(t => ["SUBMITTED", "HR_REVIEW", "DRIVER_PENDING"].includes(t.status)), true)}
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
      <TripDetailModal
        trip={selectedTrip}
        isOpen={showTripDetail}
        onClose={() => setShowTripDetail(false)}
        userRole={currentUser.role}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}