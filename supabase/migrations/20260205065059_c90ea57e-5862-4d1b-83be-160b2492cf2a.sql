-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  service_category TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  subtotal INTEGER NOT NULL,
  visit_charge INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  customer_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = customer_id);

-- Customers can create their own bookings
CREATE POLICY "Customers can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Providers can view bookings assigned to them
CREATE POLICY "Providers can view their assigned bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = provider_id);

-- Providers can update bookings assigned to them
CREATE POLICY "Providers can update their assigned bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = provider_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate booking ID
CREATE OR REPLACE FUNCTION public.generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_id := 'HH' || TO_CHAR(NOW(), 'YYMMDD') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate booking ID
CREATE TRIGGER set_booking_id
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.generate_booking_id();