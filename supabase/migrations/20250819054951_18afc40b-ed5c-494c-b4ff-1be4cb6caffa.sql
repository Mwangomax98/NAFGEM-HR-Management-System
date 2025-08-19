-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  license_type TEXT,
  license_number TEXT,
  license_expiry DATE,
  home_base TEXT,
  availability BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'available', -- available, busy, on_leave, inactive
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  capacity INTEGER,
  fuel_type TEXT,
  mileage INTEGER,
  insurance_expiry DATE,
  last_maintenance DATE,
  status TEXT NOT NULL DEFAULT 'available', -- available, in_use, maintenance, inactive
  availability BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_requests table
CREATE TABLE public.trip_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  drop_location TEXT,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  passengers_count INTEGER NOT NULL,
  luggage_notes TEXT,
  proposed_driver_id UUID REFERENCES public.drivers(id),
  proposed_vehicle_id UUID REFERENCES public.vehicles(id),
  assigned_driver_id UUID REFERENCES public.drivers(id),
  assigned_vehicle_id UUID REFERENCES public.vehicles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed, cancelled
  requester_id UUID NOT NULL,
  terms_of_reference TEXT,
  objectives TEXT,
  expected_outcomes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drivers table
CREATE POLICY "Admin and HR can manage all drivers" 
ON public.drivers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view drivers" 
ON public.drivers 
FOR SELECT 
USING (has_role(auth.uid(), 'employee'::app_role));

-- RLS Policies for vehicles table
CREATE POLICY "Admin and HR can manage all vehicles" 
ON public.vehicles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Employees can view vehicles" 
ON public.vehicles 
FOR SELECT 
USING (has_role(auth.uid(), 'employee'::app_role));

-- RLS Policies for trip_requests table
CREATE POLICY "Admin and HR can manage all trip requests" 
ON public.trip_requests 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Users can view their own trip requests" 
ON public.trip_requests 
FOR SELECT 
USING (auth.uid() = requester_id);

CREATE POLICY "Users can create their own trip requests" 
ON public.trip_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their own trip requests" 
ON public.trip_requests 
FOR UPDATE 
USING (auth.uid() = requester_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_requests_updated_at
BEFORE UPDATE ON public.trip_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();