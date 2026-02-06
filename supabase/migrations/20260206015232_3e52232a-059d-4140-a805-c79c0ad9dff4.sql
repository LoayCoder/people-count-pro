-- Fix overly permissive RLS policies for live_counts and dwell_stats
-- Drop the existing permissive INSERT policies

DROP POLICY IF EXISTS "System can insert counts" ON public.live_counts;
DROP POLICY IF EXISTS "System can insert dwell stats" ON public.dwell_stats;

-- Create more restrictive policies that only allow admins/operators to insert
CREATE POLICY "Admins/operators can insert counts" ON public.live_counts
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY "Admins/operators can insert dwell stats" ON public.dwell_stats
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));