-- Create driver availability table
CREATE TABLE public.driver_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  availability_type TEXT NOT NULL CHECK (availability_type IN ('available', 'unavailable', 'vacation', 'sick', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle maintenance table
CREATE TABLE public.vehicle_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_date TIMESTAMP WITH TIME ZONE,
  cost DECIMAL(10,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip templates table
CREATE TABLE public.trip_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  passengers_count INTEGER NOT NULL,
  estimated_duration_hours INTEGER NOT NULL,
  created_by UUID NOT NULL,
  project_id TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT, -- daily, weekly, monthly
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trip_approved', 'trip_rejected', 'trip_assigned', 'conflict_detected', 'maintenance_due')),
  read BOOLEAN NOT NULL DEFAULT false,
  trip_id UUID REFERENCES public.trip_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_availability
CREATE POLICY "Admin and HR can manage driver availability" 
ON public.driver_availability 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view driver availability" 
ON public.driver_availability 
FOR SELECT 
USING (has_role(auth.uid(), 'employee'::app_role));

-- RLS policies for vehicle_maintenance
CREATE POLICY "Admin and HR can manage vehicle maintenance" 
ON public.vehicle_maintenance 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view vehicle maintenance" 
ON public.vehicle_maintenance 
FOR SELECT 
USING (has_role(auth.uid(), 'employee'::app_role));

-- RLS policies for trip_templates
CREATE POLICY "Users can manage their own trip templates" 
ON public.trip_templates 
FOR ALL 
USING (auth.uid() = created_by);

CREATE POLICY "HR and Admin can view all trip templates" 
ON public.trip_templates 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_driver_availability_updated_at
BEFORE UPDATE ON public.driver_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_maintenance_updated_at
BEFORE UPDATE ON public.vehicle_maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_templates_updated_at
BEFORE UPDATE ON public.trip_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_driver_availability_driver_id ON public.driver_availability(driver_id);
CREATE INDEX idx_driver_availability_datetime ON public.driver_availability(start_datetime, end_datetime);
CREATE INDEX idx_vehicle_maintenance_vehicle_id ON public.vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_date ON public.vehicle_maintenance(scheduled_date);
CREATE INDEX idx_trip_templates_created_by ON public.trip_templates(created_by);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);