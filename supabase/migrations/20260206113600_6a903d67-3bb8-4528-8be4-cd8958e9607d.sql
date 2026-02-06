-- Add a column to store per-video line configuration (overrides camera config if set)
ALTER TABLE public.recorded_jobs
ADD COLUMN line_config_json jsonb DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.recorded_jobs.line_config_json IS 'Optional per-video counting line configuration that overrides camera config';