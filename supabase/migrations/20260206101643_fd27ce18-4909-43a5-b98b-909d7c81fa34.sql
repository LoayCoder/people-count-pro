-- Granular counting events for deduplication
CREATE TABLE public.counting_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE NOT NULL,
  track_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  line_id TEXT,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  confidence FLOAT,
  event_date DATE DEFAULT CURRENT_DATE NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create unique index for deduplication using the event_date column
CREATE UNIQUE INDEX idx_counting_events_dedup ON public.counting_events(camera_id, track_id, direction, event_date);

-- Index for time-series queries
CREATE INDEX idx_counting_events_camera_time ON public.counting_events(camera_id, timestamp DESC);
CREATE INDEX idx_counting_events_zone_time ON public.counting_events(zone_id, timestamp DESC);

-- Enable RLS
ALTER TABLE public.counting_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view counting events
CREATE POLICY "Authenticated can view counting events"
ON public.counting_events FOR SELECT
USING (true);

-- Admins/operators can insert counting events
CREATE POLICY "Admins/operators can insert counting events"
ON public.counting_events FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

-- Hourly aggregated stats
CREATE TABLE public.hourly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  hour_start TIMESTAMPTZ NOT NULL,
  total_in INTEGER DEFAULT 0 NOT NULL,
  total_out INTEGER DEFAULT 0 NOT NULL,
  peak_occupancy INTEGER DEFAULT 0 NOT NULL,
  avg_dwell_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_hourly_stats_camera_time ON public.hourly_stats(camera_id, hour_start DESC);
CREATE INDEX idx_hourly_stats_site_time ON public.hourly_stats(site_id, hour_start DESC);
CREATE UNIQUE INDEX idx_hourly_stats_unique ON public.hourly_stats(camera_id, hour_start) WHERE camera_id IS NOT NULL;

ALTER TABLE public.hourly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view hourly stats"
ON public.hourly_stats FOR SELECT
USING (true);

CREATE POLICY "Admins/operators can manage hourly stats"
ON public.hourly_stats FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

-- Daily aggregated stats
CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID REFERENCES public.cameras(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_in INTEGER DEFAULT 0 NOT NULL,
  total_out INTEGER DEFAULT 0 NOT NULL,
  peak_occupancy INTEGER DEFAULT 0 NOT NULL,
  peak_time TIMESTAMPTZ,
  avg_dwell_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_daily_stats_camera_date ON public.daily_stats(camera_id, date DESC);
CREATE INDEX idx_daily_stats_site_date ON public.daily_stats(site_id, date DESC);
CREATE UNIQUE INDEX idx_daily_stats_unique ON public.daily_stats(camera_id, date) WHERE camera_id IS NOT NULL;

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view daily stats"
ON public.daily_stats FOR SELECT
USING (true);

CREATE POLICY "Admins/operators can manage daily stats"
ON public.daily_stats FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

-- Audit logs for user actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_time ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- System settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view system settings"
ON public.system_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cameras;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recorded_jobs;

-- Create video-uploads storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('video-uploads', 'video-uploads', false, 524288000, ARRAY['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']);

-- RLS for video uploads
CREATE POLICY "Admins/operators can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'video-uploads' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'))
);

CREATE POLICY "Authenticated can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'video-uploads');

CREATE POLICY "Admins/operators can delete videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'video-uploads' AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'))
);