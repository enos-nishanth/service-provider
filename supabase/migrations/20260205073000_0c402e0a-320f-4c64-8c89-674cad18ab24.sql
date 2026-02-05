-- Create disputes table for handling user disputes
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  dispute_type TEXT NOT NULL, -- 'service_quality', 'payment', 'fraud', 'harassment', 'other'
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'dismissed'
  resolution TEXT,
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fraud_flags table for flagging suspicious users/reviews
CREATE TABLE public.fraud_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flag_type TEXT NOT NULL, -- 'fake_provider', 'suspicious_reviews', 'payment_fraud', 'fake_bookings'
  reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cleared', 'banned'
  flagged_by UUID NOT NULL,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

-- Disputes policies
CREATE POLICY "Admins can view all disputes"
ON public.disputes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert disputes"
ON public.disputes
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update disputes"
ON public.disputes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create disputes"
ON public.disputes
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own disputes"
ON public.disputes
FOR SELECT
USING (auth.uid() = reporter_id OR auth.uid() = reported_user_id);

-- Fraud flags policies (admin only)
CREATE POLICY "Admins can manage fraud flags"
ON public.fraud_flags
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fraud_flags_updated_at
BEFORE UPDATE ON public.fraud_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();