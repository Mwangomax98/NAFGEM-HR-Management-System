import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, User, Car, MapPin, Calendar } from 'lucide-react';
import { supabase } from "@/lib/api";
import { toast } from '@/hooks/use-toast';
import { format, addHours, isBefore, isAfter, addMinutes } from 'date-fns';

interface Conflict {
  id: string;
  type: 'driver_overlap' | 'vehicle_overlap' | 'driver_hours' | 'maintenance' | 'travel_time';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  suggestions: string[];
  affected_trips: string[];
  conflicting_resource?: {
    id: string;
    name: string;
    type: 'driver' | 'vehicle';
  };
}

interface TripRequest {
  id: string;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  pickup_location: string;
  destination: string;
  assigned_driver_id?: string;
  assigned_vehicle_id?: string;
  status: string;
}

interface ConflictDetectorProps {
  tripId?: string;
  onConflictsDetected?: (conflicts: Conflict[]) => void;
}

export function ConflictDetector({ tripId, onConflictsDetected }: ConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);

  useEffect(() => {
    if (autoCheck) {
      detectConflicts();
    }
  }, [tripId, autoCheck]);

  useEffect(() => {
    if (onConflictsDetected) {
      onConflictsDetected(conflicts);
    }
  }, [conflicts, onConflictsDetected]);

  const detectConflicts = async () => {
    setLoading(true);
    try {
      const detectedConflicts: Conflict[] = [];

      // Fetch all active trips
      const { data: trips, error: tripsError } = await supabase
        .from('trip_requests')
        .select(`
          id,
          purpose,
          start_datetime,
          end_datetime,
          pickup_location,
          destination,
          assigned_driver_id,
          assigned_vehicle_id,
          status
        `)
        .in('status', ['approved', 'in_progress']);

      if (tripsError) throw tripsError;

      const activeTrips = trips || [];

      // Check driver overlaps
      const driverConflicts = await checkDriverOverlaps(activeTrips);
      detectedConflicts.push(...driverConflicts);

      // Check vehicle overlaps
      const vehicleConflicts = await checkVehicleOverlaps(activeTrips);
      detectedConflicts.push(...vehicleConflicts);

      // Check driver working hours
      const hoursConflicts = await checkDriverWorkingHours(activeTrips);
      detectedConflicts.push(...hoursConflicts);

      // Check maintenance conflicts
      const maintenanceConflicts = await checkMaintenanceConflicts(activeTrips);
      detectedConflicts.push(...maintenanceConflicts);

      // Check travel time conflicts
      const travelConflicts = await checkTravelTimeConflicts(activeTrips);
      detectedConflicts.push(...travelConflicts);

      setConflicts(detectedConflicts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to detect conflicts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkDriverOverlaps = async (trips: TripRequest[]): Promise<Conflict[]> => {
    const conflicts: Conflict[] = [];
    const driverTrips = new Map<string, TripRequest[]>();

    // Group trips by driver
    trips.forEach(trip => {
      if (trip.assigned_driver_id) {
        if (!driverTrips.has(trip.assigned_driver_id)) {
          driverTrips.set(trip.assigned_driver_id, []);
        }
        driverTrips.get(trip.assigned_driver_id)!.push(trip);
      }
    });

    // Check for overlaps
    for (const [driverId, driverTripList] of driverTrips) {
      for (let i = 0; i < driverTripList.length; i++) {
        for (let j = i + 1; j < driverTripList.length; j++) {
          const trip1 = driverTripList[i];
          const trip2 = driverTripList[j];

          if (hasTimeOverlap(trip1, trip2)) {
            const { data: driver } = await supabase
              .from('drivers')
              .select('name')
              .eq('id', driverId)
              .single();

            conflicts.push({
              id: `driver_overlap_${trip1.id}_${trip2.id}`,
              type: 'driver_overlap',
              severity: 'critical',
              message: `Driver ${driver?.name || 'Unknown'} has overlapping trips`,
              details: `Trip "${trip1.purpose}" (${format(new Date(trip1.start_datetime), 'HH:mm')}-${format(new Date(trip1.end_datetime), 'HH:mm')}) overlaps with trip "${trip2.purpose}" (${format(new Date(trip2.start_datetime), 'HH:mm')}-${format(new Date(trip2.end_datetime), 'HH:mm')})`,
              suggestions: [
                'Assign a different driver to one of the trips',
                'Reschedule one of the trips',
                'Split the longer trip if possible'
              ],
              affected_trips: [trip1.id, trip2.id],
              conflicting_resource: {
                id: driverId,
                name: driver?.name || 'Unknown',
                type: 'driver'
              }
            });
          }
        }
      }
    }

    return conflicts;
  };

  const checkVehicleOverlaps = async (trips: TripRequest[]): Promise<Conflict[]> => {
    const conflicts: Conflict[] = [];
    const vehicleTrips = new Map<string, TripRequest[]>();

    // Group trips by vehicle
    trips.forEach(trip => {
      if (trip.assigned_vehicle_id) {
        if (!vehicleTrips.has(trip.assigned_vehicle_id)) {
          vehicleTrips.set(trip.assigned_vehicle_id, []);
        }
        vehicleTrips.get(trip.assigned_vehicle_id)!.push(trip);
      }
    });

    // Check for overlaps
    for (const [vehicleId, vehicleTripList] of vehicleTrips) {
      for (let i = 0; i < vehicleTripList.length; i++) {
        for (let j = i + 1; j < vehicleTripList.length; j++) {
          const trip1 = vehicleTripList[i];
          const trip2 = vehicleTripList[j];

          if (hasTimeOverlap(trip1, trip2)) {
            const { data: vehicle } = await supabase
              .from('vehicles')
              .select('plate_number, make, model')
              .eq('id', vehicleId)
              .single();

            conflicts.push({
              id: `vehicle_overlap_${trip1.id}_${trip2.id}`,
              type: 'vehicle_overlap',
              severity: 'critical',
              message: `Vehicle ${vehicle?.plate_number || 'Unknown'} has overlapping trips`,
              details: `Trip "${trip1.purpose}" (${format(new Date(trip1.start_datetime), 'HH:mm')}-${format(new Date(trip1.end_datetime), 'HH:mm')}) overlaps with trip "${trip2.purpose}" (${format(new Date(trip2.start_datetime), 'HH:mm')}-${format(new Date(trip2.end_datetime), 'HH:mm')})`,
              suggestions: [
                'Assign a different vehicle to one of the trips',
                'Reschedule one of the trips',
                'Use a larger vehicle if passenger count allows'
              ],
              affected_trips: [trip1.id, trip2.id],
              conflicting_resource: {
                id: vehicleId,
                name: `${vehicle?.plate_number} - ${vehicle?.make} ${vehicle?.model}` || 'Unknown',
                type: 'vehicle'
              }
            });
          }
        }
      }
    }

    return conflicts;
  };

  const checkDriverWorkingHours = async (trips: TripRequest[]): Promise<Conflict[]> => {
    const conflicts: Conflict[] = [];
    const driverDailyHours = new Map<string, Map<string, number>>();

    // Calculate daily hours for each driver
    trips.forEach(trip => {
      if (trip.assigned_driver_id) {
        const driverId = trip.assigned_driver_id;
        const date = format(new Date(trip.start_datetime), 'yyyy-MM-dd');
        const duration = (new Date(trip.end_datetime).getTime() - new Date(trip.start_datetime).getTime()) / (1000 * 60 * 60);

        if (!driverDailyHours.has(driverId)) {
          driverDailyHours.set(driverId, new Map());
        }

        const driverHours = driverDailyHours.get(driverId)!;
        driverHours.set(date, (driverHours.get(date) || 0) + duration);
      }
    });

    // Check for excessive working hours (more than 12 hours per day)
    for (const [driverId, dailyHours] of driverDailyHours) {
      for (const [date, hours] of dailyHours) {
        if (hours > 12) {
          const { data: driver } = await supabase
            .from('drivers')
            .select('name')
            .eq('id', driverId)
            .single();

          const affectedTrips = trips
            .filter(trip => 
              trip.assigned_driver_id === driverId && 
              format(new Date(trip.start_datetime), 'yyyy-MM-dd') === date
            )
            .map(trip => trip.id);

          conflicts.push({
            id: `driver_hours_${driverId}_${date}`,
            type: 'driver_hours',
            severity: 'high',
            message: `Driver ${driver?.name || 'Unknown'} exceeds daily working hours limit`,
            details: `Scheduled for ${hours.toFixed(1)} hours on ${format(new Date(date), 'MMM d, yyyy')} (limit: 12 hours)`,
            suggestions: [
              'Reassign some trips to other drivers',
              'Reschedule some trips to different days',
              'Split longer trips between multiple drivers'
            ],
            affected_trips: affectedTrips
          });
        }
      }
    }

    return conflicts;
  };

  const checkMaintenanceConflicts = async (trips: TripRequest[]): Promise<Conflict[]> => {
    const conflicts: Conflict[] = [];

    // Fetch scheduled maintenance
    const { data: maintenance } = await supabase
      .from('vehicle_maintenance')
      .select('vehicle_id, scheduled_date, maintenance_type')
      .eq('status', 'scheduled');

    if (maintenance) {
      maintenance.forEach(maint => {
        const conflictingTrips = trips.filter(trip => 
          trip.assigned_vehicle_id === maint.vehicle_id &&
          new Date(trip.start_datetime).toDateString() === new Date(maint.scheduled_date).toDateString()
        );

        if (conflictingTrips.length > 0) {
          conflicts.push({
            id: `maintenance_${maint.vehicle_id}_${maint.scheduled_date}`,
            type: 'maintenance',
            severity: 'high',
            message: 'Vehicle has scheduled maintenance',
            details: `${maint.maintenance_type} scheduled for ${format(new Date(maint.scheduled_date), 'MMM d, yyyy')}`,
            suggestions: [
              'Assign a different vehicle to the trip',
              'Reschedule the trip to avoid maintenance day',
              'Reschedule maintenance if possible'
            ],
            affected_trips: conflictingTrips.map(trip => trip.id)
          });
        }
      });
    }

    return conflicts;
  };

  const checkTravelTimeConflicts = async (trips: TripRequest[]): Promise<Conflict[]> => {
    const conflicts: Conflict[] = [];
    const driverTrips = new Map<string, TripRequest[]>();

    // Group trips by driver and sort by start time
    trips.forEach(trip => {
      if (trip.assigned_driver_id) {
        if (!driverTrips.has(trip.assigned_driver_id)) {
          driverTrips.set(trip.assigned_driver_id, []);
        }
        driverTrips.get(trip.assigned_driver_id)!.push(trip);
      }
    });

    // Check for insufficient travel time between consecutive trips
    for (const [driverId, driverTripList] of driverTrips) {
      const sortedTrips = driverTripList.sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );

      for (let i = 0; i < sortedTrips.length - 1; i++) {
        const currentTrip = sortedTrips[i];
        const nextTrip = sortedTrips[i + 1];

        const timeBetween = (new Date(nextTrip.start_datetime).getTime() - new Date(currentTrip.end_datetime).getTime()) / (1000 * 60);
        const estimatedTravelTime = estimateTravelTime(currentTrip.destination, nextTrip.pickup_location);

        if (timeBetween < estimatedTravelTime) {
          const { data: driver } = await supabase
            .from('drivers')
            .select('name')
            .eq('id', driverId)
            .single();

          conflicts.push({
            id: `travel_time_${currentTrip.id}_${nextTrip.id}`,
            type: 'travel_time',
            severity: 'medium',
            message: `Insufficient travel time for driver ${driver?.name || 'Unknown'}`,
            details: `Only ${timeBetween} minutes between trips ending at ${currentTrip.destination} and starting at ${nextTrip.pickup_location} (estimated travel time: ${estimatedTravelTime} minutes)`,
            suggestions: [
              'Add buffer time between trips',
              'Reassign one of the trips to a different driver',
              'Adjust trip schedules to allow for travel time'
            ],
            affected_trips: [currentTrip.id, nextTrip.id]
          });
        }
      }
    }

    return conflicts;
  };

  const hasTimeOverlap = (trip1: TripRequest, trip2: TripRequest): boolean => {
    const start1 = new Date(trip1.start_datetime);
    const end1 = new Date(trip1.end_datetime);
    const start2 = new Date(trip2.start_datetime);
    const end2 = new Date(trip2.end_datetime);

    return (start1 < end2) && (start2 < end1);
  };

  const estimateTravelTime = (from: string, to: string): number => {
    // Simple heuristic - in a real app, you'd use a mapping service
    if (from === to) return 0;
    
    // Assume average travel time based on location type
    const cityTravel = 30; // 30 minutes for city-to-city travel
    const localTravel = 15; // 15 minutes for local travel
    
    // Simple check - if locations are very different, assume longer travel
    if (from.toLowerCase().includes('airport') || to.toLowerCase().includes('airport')) {
      return 45;
    }
    
    return from.toLowerCase() === to.toLowerCase() ? localTravel : cityTravel;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadgeVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Conflict Detection</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={detectConflicts}
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Conflicts'}
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Detecting conflicts...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && conflicts.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No conflicts detected. All trips are properly scheduled.
          </AlertDescription>
        </Alert>
      )}

      {!loading && conflicts.length > 0 && (
        <div className="space-y-3">
          {conflicts.map(conflict => (
            <Alert key={conflict.id} className="border-l-4 border-l-destructive">
              <AlertTriangle className={`h-4 w-4 ${getSeverityColor(conflict.severity)}`} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <AlertDescription className="font-medium">
                    {conflict.message}
                  </AlertDescription>
                  <Badge variant={getSeverityBadgeVariant(conflict.severity)}>
                    {conflict.severity.toUpperCase()}
                  </Badge>
                </div>
                
                <AlertDescription className="text-sm text-muted-foreground">
                  {conflict.details}
                </AlertDescription>
                
                {conflict.suggestions.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Suggestions:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {conflict.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}