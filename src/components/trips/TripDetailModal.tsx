import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, Car, User, FileText, Clock, AlertTriangle } from "lucide-react";
import TripStatusBadge from "./TripStatusBadge";
import { logTripStatusChange } from "@/utils/auditLogger";
import { exportTripToPDF } from "@/utils/pdfExport";
import { toast } from "@/hooks/use-toast";

interface TripDetailModalProps {
  trip: any;
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onStatusUpdate?: (tripId: string, newStatus: string, reason?: string) => void;
}

export default function TripDetailModal({ trip, isOpen, onClose, userRole, onStatusUpdate }: TripDetailModalProps) {
  if (!trip) return null;

  const canApprove = userRole === "hr" || userRole === "admin";
  const canEditAssignment = userRole === "hr" || userRole === "admin";
  const isDriver = false; // TODO: Implement driver check

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    // Fix #3: Audit logging for status updates
    await logTripStatusChange(trip.id, trip.status, newStatus, {
      destination: trip.destination,
      reason: reason || 'Manual status update'
    });

    onStatusUpdate?.(trip.id, newStatus, reason);
    onClose();
  };

  const statusTimeline = [
    { status: "PENDING", label: "Submitted", completed: true, date: trip.createdAt },
    { status: "APPROVED", label: "HR Approved", completed: ["APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(trip.status?.toUpperCase()), date: trip.hrReviewAt },
    { status: "SCHEDULED", label: "Scheduled", completed: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(trip.status?.toUpperCase()), date: trip.scheduledAt },
    { status: "IN_PROGRESS", label: "In Progress", completed: ["IN_PROGRESS", "COMPLETED"].includes(trip.status?.toUpperCase()), date: trip.startedAt },
    { status: "COMPLETED", label: "Completed", completed: trip.status?.toUpperCase() === "COMPLETED", date: trip.completedAt }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Trip Details - {trip.destination}</span>
            <TripStatusBadge status={trip.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Trip Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Trip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project</p>
                    <p className="font-medium">{trip.projectName}</p>
                    <Badge variant="outline" className="mt-1">{trip.donorName}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p>{trip.purpose}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Destination</p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {trip.destination}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Passengers</p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {trip.passengersCount} people
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(trip.startDate).toLocaleDateString()} {trip.startTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End</p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(trip.endDate).toLocaleDateString()} {trip.endTime}
                    </p>
                  </div>
                </div>

                {(trip.pickupLocation || trip.dropLocation) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      {trip.pickupLocation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Pickup Location</p>
                          <p>{trip.pickupLocation}</p>
                        </div>
                      )}
                      {trip.dropLocation && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Drop Location</p>
                          <p>{trip.dropLocation}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Driver & Vehicle Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Driver & Vehicle Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned Driver</p>
                    {trip.assignedDriverName ? (
                      <p className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {trip.assignedDriverName}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Pending assignment</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned Vehicle</p>
                    {trip.assignedVehicle ? (
                      <p className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        {trip.assignedVehicle}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Pending assignment</p>
                    )}
                  </div>
                </div>

                {canEditAssignment && trip.status?.toUpperCase() === "PENDING" && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      Assign Driver
                    </Button>
                    <Button variant="outline" size="sm">
                      Assign Vehicle
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms of Reference */}
            {(trip.objectives || trip.expectedOutcomes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Terms of Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trip.objectives && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Objectives</p>
                      <p className="text-sm bg-muted p-3 rounded-md">{trip.objectives}</p>
                    </div>
                  )}
                  {trip.expectedOutcomes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Expected Outcomes</p>
                      <p className="text-sm bg-muted p-3 rounded-md">{trip.expectedOutcomes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusTimeline.map((item, index) => (
                    <div key={item.status} className="flex items-start gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        item.completed ? 'bg-accent' : 'bg-muted'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          item.completed ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {item.label}
                        </p>
                        {item.date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* HR/Admin Actions */}
                {canApprove && trip.status?.toUpperCase() === "PENDING" && (
                  <>
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusUpdate("approved")}
                    >
                      Approve Request
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleStatusUpdate("rejected")}
                    >
                      Reject Request
                    </Button>
                  </>
                )}

                {canApprove && trip.status?.toUpperCase() === "APPROVED" && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusUpdate("scheduled")}
                  >
                    Schedule Trip
                  </Button>
                )}

                {/* Universal Actions */}
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    exportTripToPDF(trip);
                  }}
                >
                  Print Details
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    exportTripToPDF(trip);
                    toast({
                      title: "PDF Export",
                      description: "Trip request PDF is being generated",
                    });
                  }}
                >
                  Export to PDF
                </Button>
              </CardContent>
            </Card>

            {/* Requester Info */}
            <Card>
              <CardHeader>
                <CardTitle>Requested By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{trip.requesterName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}