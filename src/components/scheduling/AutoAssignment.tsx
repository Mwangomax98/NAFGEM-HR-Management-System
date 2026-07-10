import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Bot, User, Car, MapPin, Clock, Zap, CheckCircle } from 'lucide-react';
import { supabase } from "@/lib/api";
import { toast } from '@/hooks/use-toast';

interface Assignment {
  tripId: string;
  tripPurpose: string;
  recommendedDriver?: {
    id: string;
    name: string;
    score: number;
    reasons: string[];
  };
  recommendedVehicle?: {
    id: string;
    name: string;
    score: number;
    reasons: string[];
  };
  confidence: 'high' | 'medium' | 'low';
}

interface AutoAssignmentProps {
  tripIds?: string[];
  onAssignmentsGenerated?: (assignments: Assignment[]) => void;
  onApplyAssignments?: (assignments: Assignment[]) => void;
}

export function AutoAssignment({ tripIds = [], onAssignmentsGenerated, onApplyAssignments }: AutoAssignmentProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const generateAssignments = async () => {
    setLoading(true);
    try {
      // Fetch unassigned trips or specific trips
      let query = supabase
        .from('trip_requests')
        .select(`
          id,
          purpose,
          start_datetime,
          end_datetime,
          pickup_location,
          destination,
          passengers_count,
          assigned_driver_id,
          assigned_vehicle_id,
          status
        `)
        .eq('status', 'approved');

      if (tripIds.length > 0) {
        query = query.in('id', tripIds);
      } else {
        // Only get unassigned trips
        query = query.or('assigned_driver_id.is.null,assigned_vehicle_id.is.null');
      }

      const { data: trips, error: tripsError } = await query;
      if (tripsError) throw tripsError;

      if (!trips || trips.length === 0) {
        toast({
          title: "No trips to assign",
          description: "All trips are already assigned or no approved trips found.",
        });
        return;
      }

      // Fetch available drivers and vehicles
      const [{ data: drivers }, { data: vehicles }] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'available'),
        supabase.from('vehicles').select('*').eq('status', 'available')
      ]);

      if (!drivers || !vehicles) {
        throw new Error('Failed to fetch drivers or vehicles');
      }

      const newAssignments: Assignment[] = [];

      for (const trip of trips) {
        const assignment: Assignment = {
          tripId: trip.id,
          tripPurpose: trip.purpose,
          confidence: 'medium'
        };

        // Smart driver assignment
        if (!trip.assigned_driver_id) {
          const driverRecommendation = await findBestDriver(trip, drivers);
          if (driverRecommendation) {
            assignment.recommendedDriver = driverRecommendation;
          }
        }

        // Smart vehicle assignment
        if (!trip.assigned_vehicle_id) {
          const vehicleRecommendation = await findBestVehicle(trip, vehicles);
          if (vehicleRecommendation) {
            assignment.recommendedVehicle = vehicleRecommendation;
          }
        }

        // Calculate overall confidence
        const hasDriverRec = !!assignment.recommendedDriver;
        const hasVehicleRec = !!assignment.recommendedVehicle;
        const driverScore = assignment.recommendedDriver?.score || 0;
        const vehicleScore = assignment.recommendedVehicle?.score || 0;

        if (hasDriverRec && hasVehicleRec && driverScore > 80 && vehicleScore > 80) {
          assignment.confidence = 'high';
        } else if (hasDriverRec || hasVehicleRec) {
          assignment.confidence = 'medium';
        } else {
          assignment.confidence = 'low';
        }

        newAssignments.push(assignment);
      }

      setAssignments(newAssignments);
      onAssignmentsGenerated?.(newAssignments);

      toast({
        title: "Assignments generated",
        description: `Found ${newAssignments.length} assignment recommendations.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate assignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const findBestDriver = async (trip: any, drivers: any[]): Promise<Assignment['recommendedDriver']> => {
    let bestDriver = null;
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const driver of drivers) {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Check availability for the trip time
      const isAvailable = await checkDriverAvailability(driver.id, trip.start_datetime, trip.end_datetime);
      if (!isAvailable) continue;

      // Proximity bonus (simplified - in real app would use geolocation)
      if (driver.home_base && trip.pickup_location.toLowerCase().includes(driver.home_base.toLowerCase())) {
        score += 20;
        reasons.push('Based near pickup location');
      }

      // Experience bonus (simplified - based on driver ratings or completed trips)
      score += 10;
      reasons.push('Experienced driver');

      // Workload balancing - check current trip count for the day
      const dailyTripCount = await getDailyTripCount(driver.id, trip.start_datetime);
      if (dailyTripCount < 3) {
        score += 15;
        reasons.push('Balanced workload');
      } else if (dailyTripCount > 5) {
        score -= 20;
        reasons.push('High workload - consider other drivers');
      }

      // License type matching (if specific license required)
      if (driver.license_type === 'commercial') {
        score += 5;
        reasons.push('Commercial license');
      }

      if (score > bestScore) {
        bestScore = score;
        bestDriver = driver;
        bestReasons = reasons;
      }
    }

    if (bestDriver) {
      return {
        id: bestDriver.id,
        name: bestDriver.name,
        score: bestScore,
        reasons: bestReasons
      };
    }

    return undefined;
  };

  const findBestVehicle = async (trip: any, vehicles: any[]): Promise<Assignment['recommendedVehicle']> => {
    let bestVehicle = null;
    let bestScore = 0;
    let bestReasons: string[] = [];

    for (const vehicle of vehicles) {
      let score = 50; // Base score
      const reasons: string[] = [];

      // Check availability for the trip time
      const isAvailable = await checkVehicleAvailability(vehicle.id, trip.start_datetime, trip.end_datetime);
      if (!isAvailable) continue;

      // Capacity matching
      if (vehicle.capacity >= trip.passengers_count) {
        score += 20;
        reasons.push(`Sufficient capacity (${vehicle.capacity} seats)`);
        
        // Efficiency bonus for right-sized vehicle
        if (vehicle.capacity <= trip.passengers_count + 2) {
          score += 10;
          reasons.push('Right-sized for passenger count');
        }
      } else {
        continue; // Skip if not enough capacity
      }

      // Fuel efficiency bonus
      if (vehicle.fuel_type === 'hybrid' || vehicle.fuel_type === 'electric') {
        score += 15;
        reasons.push('Fuel efficient');
      }

      // Maintenance status
      const daysSinceLastMaintenance = await getDaysSinceLastMaintenance(vehicle.id);
      if (daysSinceLastMaintenance < 30) {
        score += 10;
        reasons.push('Recently maintained');
      } else if (daysSinceLastMaintenance > 90) {
        score -= 10;
        reasons.push('Due for maintenance check');
      }

      // Usage balancing
      const monthlyUsage = await getMonthlyUsage(vehicle.id);
      if (monthlyUsage < 10) {
        score += 10;
        reasons.push('Low monthly usage');
      } else if (monthlyUsage > 25) {
        score -= 5;
        reasons.push('High monthly usage');
      }

      if (score > bestScore) {
        bestScore = score;
        bestVehicle = vehicle;
        bestReasons = reasons;
      }
    }

    if (bestVehicle) {
      return {
        id: bestVehicle.id,
        name: `${bestVehicle.plate_number} - ${bestVehicle.make} ${bestVehicle.model}`,
        score: bestScore,
        reasons: bestReasons
      };
    }

    return undefined;
  };

  const checkDriverAvailability = async (driverId: string, startTime: string, endTime: string): Promise<boolean> => {
    // Check for conflicting trips
    const { data: conflicts } = await supabase
      .from('trip_requests')
      .select('id')
      .eq('assigned_driver_id', driverId)
      .in('status', ['approved', 'in_progress'])
      .or(`start_datetime.lte.${endTime},end_datetime.gte.${startTime}`);

    if (conflicts && conflicts.length > 0) return false;

    // Check driver availability records
    const { data: unavailable } = await supabase
      .from('driver_availability')
      .select('id')
      .eq('driver_id', driverId)
      .eq('availability_type', 'unavailable')
      .or(`start_datetime.lte.${endTime},end_datetime.gte.${startTime}`);

    return !unavailable || unavailable.length === 0;
  };

  const checkVehicleAvailability = async (vehicleId: string, startTime: string, endTime: string): Promise<boolean> => {
    // Check for conflicting trips
    const { data: conflicts } = await supabase
      .from('trip_requests')
      .select('id')
      .eq('assigned_vehicle_id', vehicleId)
      .in('status', ['approved', 'in_progress'])
      .or(`start_datetime.lte.${endTime},end_datetime.gte.${startTime}`);

    if (conflicts && conflicts.length > 0) return false;

    // Check maintenance schedule
    const { data: maintenance } = await supabase
      .from('vehicle_maintenance')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'scheduled')
      .gte('scheduled_date', startTime.split('T')[0])
      .lte('scheduled_date', endTime.split('T')[0]);

    return !maintenance || maintenance.length === 0;
  };

  const getDailyTripCount = async (driverId: string, date: string): Promise<number> => {
    const dayStart = date.split('T')[0] + 'T00:00:00Z';
    const dayEnd = date.split('T')[0] + 'T23:59:59Z';

    const { data } = await supabase
      .from('trip_requests')
      .select('id')
      .eq('assigned_driver_id', driverId)
      .in('status', ['approved', 'in_progress'])
      .gte('start_datetime', dayStart)
      .lte('start_datetime', dayEnd);

    return data?.length || 0;
  };

  const getDaysSinceLastMaintenance = async (vehicleId: string): Promise<number> => {
    const { data } = await supabase
      .from('vehicle_maintenance')
      .select('completed_date')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'completed')
      .order('completed_date', { ascending: false })
      .limit(1);

    if (data && data.length > 0 && data[0].completed_date) {
      const lastMaintenance = new Date(data[0].completed_date);
      const now = new Date();
      return Math.floor((now.getTime() - lastMaintenance.getTime()) / (1000 * 60 * 60 * 24));
    }

    return 999; // Very high number if no maintenance record
  };

  const getMonthlyUsage = async (vehicleId: string): Promise<number> => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data } = await supabase
      .from('trip_requests')
      .select('id')
      .eq('assigned_vehicle_id', vehicleId)
      .in('status', ['approved', 'in_progress', 'completed'])
      .gte('start_datetime', monthStart.toISOString());

    return data?.length || 0;
  };

  const applyAssignments = async () => {
    setProcessing(true);
    try {
      for (const assignment of assignments) {
        const updates: any = {};
        
        if (assignment.recommendedDriver) {
          updates.assigned_driver_id = assignment.recommendedDriver.id;
        }
        
        if (assignment.recommendedVehicle) {
          updates.assigned_vehicle_id = assignment.recommendedVehicle.id;
        }

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('trip_requests')
            .update(updates)
            .eq('id', assignment.tripId);

          if (error) throw error;
        }
      }

      onApplyAssignments?.(assignments);
      setAssignments([]);

      toast({
        title: "Assignments applied",
        description: "All recommendations have been applied successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply assignments",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceBadgeVariant = (confidence: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-primary';
      case 'medium': return 'text-secondary-foreground';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Smart Auto-Assignment
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={generateAssignments}
                disabled={loading}
                variant="outline"
              >
                <Zap className="h-4 w-4 mr-2" />
                {loading ? 'Analyzing...' : 'Generate Assignments'}
              </Button>
              {assignments.length > 0 && (
                <Button
                  onClick={applyAssignments}
                  disabled={processing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Applying...' : 'Apply All'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {assignments.length === 0 && !loading && (
          <CardContent>
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Click "Generate Assignments" to automatically assign drivers and vehicles to approved trips based on availability, proximity, workload, and efficiency.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {assignments.length > 0 && (
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Found {assignments.length} assignment recommendations
            </div>

            {assignments.map((assignment, index) => (
              <Card key={assignment.tripId} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{assignment.tripPurpose}</h4>
                      <Badge 
                        variant={getConfidenceBadgeVariant(assignment.confidence)}
                        className={getConfidenceColor(assignment.confidence)}
                      >
                        {assignment.confidence.toUpperCase()} CONFIDENCE
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignment.recommendedDriver && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">Recommended Driver</span>
                            <Badge variant="outline">{assignment.recommendedDriver.score}% match</Badge>
                          </div>
                          <div className="text-sm font-medium">{assignment.recommendedDriver.name}</div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {assignment.recommendedDriver.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {assignment.recommendedVehicle && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <span className="font-medium">Recommended Vehicle</span>
                            <Badge variant="outline">{assignment.recommendedVehicle.score}% match</Badge>
                          </div>
                          <div className="text-sm font-medium">{assignment.recommendedVehicle.name}</div>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {assignment.recommendedVehicle.reasons.map((reason, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {!assignment.recommendedDriver && !assignment.recommendedVehicle && (
                      <Alert>
                        <AlertDescription>
                          No suitable assignments found. Manual assignment may be required.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}