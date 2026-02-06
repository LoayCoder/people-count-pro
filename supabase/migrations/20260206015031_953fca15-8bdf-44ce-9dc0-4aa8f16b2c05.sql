-- Create enums for roles and statuses
CREATE TYPE public.app_role AS ENUM ('admin', 'operator', 'viewer');
CREATE TYPE public.camera_input_type AS ENUM ('live_rtsp', 'recorded_file');
CREATE TYPE public.camera_status AS ENUM ('online', 'offline', 'processing', 'error');
CREATE TYPE public.alert_type AS ENUM ('occupancy_threshold', 'spike_detected', 'camera_offline', 'worker_failure');
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.alert_status AS ENUM ('new', 'acknowledged', 'closed');
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- User roles table (separate from profiles as per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sites/Locations table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zones within sites
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  max_occupancy INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cameras table
CREATE TABLE public.cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  input_type camera_input_type NOT NULL DEFAULT 'live_rtsp',
  rtsp_url TEXT,
  stream_type TEXT DEFAULT 'main',
  enabled BOOLEAN NOT NULL DEFAULT true,
  status camera_status NOT NULL DEFAULT 'offline',
  last_snapshot_url TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Camera configurations (ROI, counting lines, zones)
CREATE TABLE public.camera_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE NOT NULL UNIQUE,
  roi_json JSONB DEFAULT '[]'::jsonb,
  line_json JSONB DEFAULT '[]'::jsonb,
  zone_json JSONB DEFAULT '[]'::jsonb,
  thresholds_json JSONB DEFAULT '{"confidence": 0.5, "min_track_age": 3, "max_lost_frames": 30}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Live counting data (time-series)
CREATE TABLE public.live_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  in_count INTEGER NOT NULL DEFAULT 0,
  out_count INTEGER NOT NULL DEFAULT 0,
  occupancy INTEGER NOT NULL DEFAULT 0
);

-- Create index for time-series queries
CREATE INDEX idx_live_counts_camera_timestamp ON public.live_counts(camera_id, timestamp DESC);

-- Dwell statistics
CREATE TABLE public.dwell_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE NOT NULL,
  track_id TEXT NOT NULL,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  dwell_seconds INTEGER NOT NULL DEFAULT 0,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ
);

-- Recorded video processing jobs
CREATE TABLE public.recorded_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_name TEXT NOT NULL,
  video_url TEXT,
  camera_id UUID REFERENCES public.cameras(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  result_json JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'medium',
  message TEXT NOT NULL,
  status alert_status NOT NULL DEFAULT 'new',
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alert rules configuration
CREATE TABLE public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  threshold_value INTEGER,
  enabled BOOLEAN NOT NULL DEFAULT true,
  notify_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dwell_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorded_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'operator' THEN 2 
      WHEN 'viewer' THEN 3 
    END
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles (admin only for modifications)
CREATE POLICY "Anyone can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sites (all authenticated can view, admin/operator can modify)
CREATE POLICY "Authenticated can view sites" ON public.sites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage sites" ON public.sites
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for zones
CREATE POLICY "Authenticated can view zones" ON public.zones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/operators can manage zones" ON public.zones
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for cameras
CREATE POLICY "Authenticated can view cameras" ON public.cameras
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/operators can manage cameras" ON public.cameras
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for camera_configs
CREATE POLICY "Authenticated can view configs" ON public.camera_configs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/operators can manage configs" ON public.camera_configs
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for live_counts (read for all, insert for system)
CREATE POLICY "Authenticated can view counts" ON public.live_counts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert counts" ON public.live_counts
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for dwell_stats
CREATE POLICY "Authenticated can view dwell stats" ON public.dwell_stats
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert dwell stats" ON public.dwell_stats
  FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for recorded_jobs
CREATE POLICY "Authenticated can view jobs" ON public.recorded_jobs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/operators can manage jobs" ON public.recorded_jobs
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for alerts
CREATE POLICY "Authenticated can view alerts" ON public.alerts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/operators can manage alerts" ON public.alerts
  FOR ALL TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

-- RLS Policies for alert_rules
CREATE POLICY "Authenticated can view alert rules" ON public.alert_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage alert rules" ON public.alert_rules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign default viewer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cameras_updated_at
  BEFORE UPDATE ON public.cameras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_camera_configs_updated_at
  BEFORE UPDATE ON public.camera_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();