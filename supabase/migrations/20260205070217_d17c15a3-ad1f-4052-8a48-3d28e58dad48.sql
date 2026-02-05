-- Create provider_schedules table for working days and time slots
CREATE TABLE public.provider_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working BOOLEAN NOT NULL DEFAULT true,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, day_of_week)
);

-- Create provider_skills table for multiple skills
CREATE TABLE public.provider_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  experience_years INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, skill_name)
);

-- Create provider_service_areas table
CREATE TABLE public.provider_service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  pincode TEXT,
  radius_km INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, area_name)
);

-- Enable RLS
ALTER TABLE public.provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_service_areas ENABLE ROW LEVEL SECURITY;

-- Providers can view/manage their own schedules
CREATE POLICY "Providers can view own schedules"
ON public.provider_schedules FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own schedules"
ON public.provider_schedules FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own schedules"
ON public.provider_schedules FOR UPDATE
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own schedules"
ON public.provider_schedules FOR DELETE
USING (auth.uid() = provider_id);

-- Providers can view/manage their own skills
CREATE POLICY "Providers can view own skills"
ON public.provider_skills FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own skills"
ON public.provider_skills FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own skills"
ON public.provider_skills FOR UPDATE
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own skills"
ON public.provider_skills FOR DELETE
USING (auth.uid() = provider_id);

-- Public can view provider skills (for browsing)
CREATE POLICY "Public can view provider skills"
ON public.provider_skills FOR SELECT
USING (true);

-- Providers can view/manage their own service areas
CREATE POLICY "Providers can view own areas"
ON public.provider_service_areas FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own areas"
ON public.provider_service_areas FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own areas"
ON public.provider_service_areas FOR UPDATE
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own areas"
ON public.provider_service_areas FOR DELETE
USING (auth.uid() = provider_id);

-- Public can view provider areas (for browsing)
CREATE POLICY "Public can view provider areas"
ON public.provider_service_areas FOR SELECT
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_provider_schedules_updated_at
BEFORE UPDATE ON public.provider_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();