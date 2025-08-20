import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Car, User, Clock, MapPin } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TripEvent {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  driver_name?: string;
  vehicle_plate?: string;
  pickup_location: string;
  destination: string;
}

interface Driver {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
}

export function TripCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [trips, setTrips] = useState<TripEvent[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedDriver, selectedVehicle]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      // Fetch trips for the selected month
      let tripsQuery = supabase
        .from('trip_requests')
        .select(`
          id,
          purpose,
          start_datetime,
          end_datetime,
          status,
          pickup_location,
          destination,
          assigned_driver_id,
          assigned_vehicle_id
        `)
        .gte('start_datetime', monthStart.toISOString())
        .lte('start_datetime', monthEnd.toISOString());

      if (selectedDriver !== 'all') {
        tripsQuery = tripsQuery.eq('assigned_driver_id', selectedDriver);
      }

      if (selectedVehicle !== 'all') {
        tripsQuery = tripsQuery.eq('assigned_vehicle_id', selectedVehicle);
      }

      const { data: tripsData, error: tripsError } = await tripsQuery;

      if (tripsError) throw tripsError;

      // Fetch drivers and vehicles for filters and trip details
      const [{ data: driversData }, { data: vehiclesData }] = await Promise.all([
        supabase.from('drivers').select('id, name').eq('status', 'available'),
        supabase.from('vehicles').select('id, plate_number, make, model').eq('status', 'available')
      ]);

      // Create lookup maps for drivers and vehicles
      const driversMap = new Map(driversData?.map(d => [d.id, d]) || []);
      const vehiclesMap = new Map(vehiclesData?.map(v => [v.id, v]) || []);

      setTrips(tripsData?.map(trip => ({
        id: trip.id,
        title: trip.purpose,
        start_datetime: trip.start_datetime,
        end_datetime: trip.end_datetime,
        status: trip.status,
        driver_name: trip.assigned_driver_id ? driversMap.get(trip.assigned_driver_id)?.name : undefined,
        vehicle_plate: trip.assigned_vehicle_id ? vehiclesMap.get(trip.assigned_vehicle_id)?.plate_number : undefined,
        pickup_location: trip.pickup_location,
        destination: trip.destination
      })) || []);

      setDrivers(driversData || []);
      setVehicles(vehiclesData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calendar data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getTripsForDay = (date: Date) => {
    return trips.filter(trip => 
      isSameDay(new Date(trip.start_datetime), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-primary';
      case 'pending': return 'bg-secondary';
      case 'in_progress': return 'bg-accent';
      case 'completed': return 'bg-primary';
      case 'rejected': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Trip Calendar - {format(selectedDate, 'MMMM yyyy')}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <Select value={view} onValueChange={(value: 'month' | 'week' | 'day') => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          {view === 'month' && (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth().map(date => {
                const dayTrips = getTripsForDay(date);
                const isToday = isSameDay(date, new Date());
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`min-h-32 p-1 border border-border ${
                      isToday ? 'bg-accent/20' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(date, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTrips.slice(0, 3).map(trip => (
                        <div
                          key={trip.id}
                          className={`text-xs p-1 rounded text-white ${getStatusColor(trip.status)}`}
                        >
                          <div className="font-medium truncate">{trip.title}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(trip.start_datetime), 'HH:mm')}
                          </div>
                          {trip.driver_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="truncate">{trip.driver_name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {dayTrips.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayTrips.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'day' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              
              <div className="space-y-2">
                {getTripsForDay(selectedDate).map(trip => (
                  <Card key={trip.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{trip.title}</h4>
                            <Badge variant="secondary" className={getStatusColor(trip.status)}>
                              {trip.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(new Date(trip.start_datetime), 'HH:mm')} - 
                              {format(new Date(trip.end_datetime), 'HH:mm')}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {trip.pickup_location} → {trip.destination}
                            </div>
                          </div>
                          
                          {(trip.driver_name || trip.vehicle_plate) && (
                            <div className="flex items-center gap-4 text-sm">
                              {trip.driver_name && (
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {trip.driver_name}
                                </div>
                              )}
                              
                              {trip.vehicle_plate && (
                                <div className="flex items-center gap-1">
                                  <Car className="h-4 w-4" />
                                  {trip.vehicle_plate}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {getTripsForDay(selectedDate).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No trips scheduled for this day
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}