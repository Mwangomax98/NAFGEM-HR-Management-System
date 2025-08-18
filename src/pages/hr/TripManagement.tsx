import { useState } from "react";
import { HRLayout } from "@/components/hr/HRLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TripDetailModal from "@/components/trips/TripDetailModal";
import TripStatusBadge from "@/components/trips/TripStatusBadge";
import ConflictAlert from "@/components/trips/ConflictAlert";
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Car, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  MapPin,
  Settings
} from "lucide-react";

type TripStatus = 
  | "DRAFT" 
  | "SUBMITTED" 
  | "HR_REVIEW" 
  | "DRIVER_PENDING" 
  | "SCHEDULED" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "REJECTED";

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

// Mock data for demonstration
const mockTrips: Trip[] = [
  {
    id: "TR-2024-001",
    projectId: "WFP-001",
    projectName: "Food Security Program",
    donorName: "World Food Programme",
    purpose: "Community Assessment Visit",
    destination: "Makeni District",
    pickupLocation: "Freetown Office",
    dropLocation: "Makeni Community Center",
    startDateTime: "2024-01-15T08:00:00",
    endDateTime: "2024-01-15T17:00:00",
    passengersCount: 3,
    proposedDriverId: "emp-001",
    proposedVehicleId: "veh-001",
    assignedDriverId: null,
    assignedVehicleId: null,
    status: "HR_REVIEW",
    requesterName: "John Kamara",
    requesterDepartment: "Programs",
    termsOfReference: "Assess community needs and distribute aid packages",
    luggageNotes: "Medical supplies and food packages",
    conflicts: [
      {
        type: "driver" as const,
        message: "Driver has another trip scheduled 2:00-4:00 PM",
        severity: "warning" as const,
        suggestions: ["Suggest alternative driver", "Shift time to morning"]
      }
    ]
  },
  {
    id: "TR-2024-002",
    projectId: "UNICEF-002",
    projectName: "Child Protection Initiative",
    donorName: "UNICEF",
    purpose: "School Visit & Monitoring",
    destination: "Bo District",
    pickupLocation: "Freetown Office",
    dropLocation: "Bo Primary School",
    startDateTime: "2024-01-16T09:00:00",
    endDateTime: "2024-01-16T16:00:00",
    passengersCount: 2,
    proposedDriverId: "emp-002",
    proposedVehicleId: "veh-002",
    assignedDriverId: "emp-002",
    assignedVehicleId: "veh-002",
    status: "DRIVER_PENDING",
    requesterName: "Sarah Johnson",
    requesterDepartment: "Education",
    termsOfReference: "Monitor school feeding program implementation",
    luggageNotes: "Educational materials",
    conflicts: []
  }
];

const mockDrivers = [
  { id: "emp-001", name: "Mohamed Sesay", availability: "busy", phone: "+232-77-123456" },
  { id: "emp-002", name: "Ibrahim Kargbo", availability: "available", phone: "+232-76-789012" },
  { id: "emp-003", name: "Fatima Bangura", availability: "available", phone: "+232-78-345678" }
];

const mockVehicles = [
  { id: "veh-001", plate: "SL-001-ABC", model: "Toyota Hilux", capacity: 5, status: "available" },
  { id: "veh-002", plate: "SL-002-DEF", model: "Nissan Patrol", capacity: 7, status: "maintenance" },
  { id: "veh-003", plate: "SL-003-GHI", model: "Toyota Land Cruiser", capacity: 8, status: "available" }
];

export default function TripManagement() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const filteredTrips = mockTrips.filter(trip => {
    const matchesSearch = trip.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    const matchesProject = projectFilter === "all" || trip.projectId === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const getStatusCounts = () => {
    return {
      total: mockTrips.length,
      pending: mockTrips.filter(t => t.status === "HR_REVIEW").length,
      driverPending: mockTrips.filter(t => t.status === "DRIVER_PENDING").length,
      scheduled: mockTrips.filter(t => t.status === "SCHEDULED").length,
      inProgress: mockTrips.filter(t => t.status === "IN_PROGRESS").length
    };
  };

  const statusCounts = getStatusCounts();

  const handleApprove = (tripId: string) => {
    console.log("Approving trip:", tripId);
    // Handle approval logic
  };

  const handleReject = (tripId: string) => {
    console.log("Rejecting trip:", tripId);
    // Handle rejection logic
  };

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Trip Management</h1>
          <p className="text-muted-foreground">Review and manage trip requests, assignments, and schedules</p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts.total}</p>
                  <p className="text-xs text-muted-foreground">Total Trips</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts.driverPending}</p>
                  <p className="text-xs text-muted-foreground">Driver Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts.scheduled}</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Car className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{statusCounts.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox">HR Inbox</TabsTrigger>
            <TabsTrigger value="drivers">Driver Management</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Management</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search trips..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="HR_REVIEW">HR Review</SelectItem>
                      <SelectItem value="DRIVER_PENDING">Driver Pending</SelectItem>
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
                      <SelectItem value="WFP-001">WFP Food Security</SelectItem>
                      <SelectItem value="UNICEF-002">UNICEF Child Protection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Trip Cards */}
            <div className="space-y-4">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <CardTitle className="text-lg">{trip.purpose}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {trip.projectName} • {trip.requesterName}
                          </p>
                        </div>
                        <TripStatusBadge status={trip.status} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTrip(trip)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.destination}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(trip.startDateTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{trip.passengersCount} passengers</span>
                      </div>
                    </div>

                    {trip.conflicts && trip.conflicts.length > 0 && (
                      <ConflictAlert conflicts={trip.conflicts} />
                    )}

                    {trip.status === "HR_REVIEW" && (
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          onClick={() => handleApprove(trip.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve & Assign
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleReject(trip.id)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button variant="outline">
                          Request Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Driver Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDrivers.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-muted-foreground">{driver.phone}</p>
                        </div>
                      </div>
                      <Badge variant={driver.availability === "available" ? "default" : "secondary"}>
                        {driver.availability}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Fleet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Car className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.plate} • {vehicle.capacity} seats
                          </p>
                        </div>
                      </div>
                      <Badge variant={vehicle.status === "available" ? "default" : "destructive"}>
                        {vehicle.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Calendar integration coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trip Reports & Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Reports and analytics dashboard coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Trip Detail Modal */}
        {selectedTrip && (
          <TripDetailModal
            trip={selectedTrip}
            isOpen={!!selectedTrip}
            onClose={() => setSelectedTrip(null)}
            userRole="hr"
          />
        )}
      </div>
    </HRLayout>
  );
}