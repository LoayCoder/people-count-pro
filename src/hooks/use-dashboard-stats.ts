import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface DashboardStats {
  currentOccupancy: number;
  totalInToday: number;
  totalOutToday: number;
  peakOccupancy: number;
  peakTime: string | null;
  avgDwellSeconds: number | null;
  activeCameras: number;
  totalCameras: number;
  activeAlerts: number;
}

interface LiveCountData {
  timestamp: string;
  in_count: number;
  out_count: number;
  occupancy: number;
}

interface HourlyData {
  hour: string;
  in: number;
  out: number;
  occupancy: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split("T")[0];

      // Get camera stats
      const { data: cameras, error: camerasError } = await supabase
        .from("cameras")
        .select("status");
      
      if (camerasError) throw camerasError;

      // Get active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from("alerts")
        .select("id")
        .eq("status", "new");
      
      if (alertsError) throw alertsError;

      // Get today's live counts
      const { data: liveCounts, error: liveCountsError } = await supabase
        .from("live_counts")
        .select("in_count, out_count, occupancy, timestamp")
        .gte("timestamp", `${today}T00:00:00`)
        .order("timestamp", { ascending: false });

      if (liveCountsError) throw liveCountsError;

      // Get daily stats if available
      const { data: dailyStats, error: dailyError } = await supabase
        .from("daily_stats")
        .select("total_in, total_out, peak_occupancy, peak_time, avg_dwell_seconds")
        .eq("date", today)
        .maybeSingle();

      if (dailyError) throw dailyError;

      // Calculate stats from live counts if no daily stats
      let totalIn = dailyStats?.total_in || 0;
      let totalOut = dailyStats?.total_out || 0;
      let peakOccupancy = dailyStats?.peak_occupancy || 0;
      let peakTime = dailyStats?.peak_time || null;
      let currentOccupancy = 0;

      if (liveCounts && liveCounts.length > 0) {
        // Get current occupancy from latest entry
        currentOccupancy = liveCounts[0].occupancy || 0;
        
        // If no daily stats, calculate from live counts
        if (!dailyStats) {
          totalIn = liveCounts.reduce((sum, c) => sum + c.in_count, 0);
          totalOut = liveCounts.reduce((sum, c) => sum + c.out_count, 0);
          
          const maxEntry = liveCounts.reduce((max, c) => 
            c.occupancy > max.occupancy ? c : max, liveCounts[0]);
          peakOccupancy = maxEntry.occupancy;
          peakTime = maxEntry.timestamp;
        }
      }

      return {
        currentOccupancy,
        totalInToday: totalIn,
        totalOutToday: totalOut,
        peakOccupancy,
        peakTime,
        avgDwellSeconds: dailyStats?.avg_dwell_seconds || null,
        activeCameras: cameras?.filter(c => c.status === "online").length || 0,
        totalCameras: cameras?.length || 0,
        activeAlerts: alerts?.length || 0,
      };
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useOccupancyChartData() {
  return useQuery({
    queryKey: ["occupancy-chart-data"],
    queryFn: async (): Promise<HourlyData[]> => {
      const today = new Date().toISOString().split("T")[0];

      // Try hourly_stats first
      const { data: hourlyStats, error: hourlyError } = await supabase
        .from("hourly_stats")
        .select("hour_start, total_in, total_out, peak_occupancy")
        .gte("hour_start", `${today}T00:00:00`)
        .order("hour_start", { ascending: true });

      if (hourlyError) throw hourlyError;

      if (hourlyStats && hourlyStats.length > 0) {
        return hourlyStats.map((h) => ({
          hour: new Date(h.hour_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          in: h.total_in,
          out: h.total_out,
          occupancy: h.peak_occupancy,
        }));
      }

      // Fallback: aggregate live_counts by hour
      const { data: liveCounts, error: liveCountsError } = await supabase
        .from("live_counts")
        .select("timestamp, in_count, out_count, occupancy")
        .gte("timestamp", `${today}T00:00:00`)
        .order("timestamp", { ascending: true });

      if (liveCountsError) throw liveCountsError;

      // Group by hour
      const hourlyMap = new Map<string, { in: number; out: number; maxOccupancy: number }>();
      
      for (const entry of liveCounts || []) {
        const hour = new Date(entry.timestamp).getHours().toString().padStart(2, "0") + ":00";
        const existing = hourlyMap.get(hour) || { in: 0, out: 0, maxOccupancy: 0 };
        hourlyMap.set(hour, {
          in: existing.in + entry.in_count,
          out: existing.out + entry.out_count,
          maxOccupancy: Math.max(existing.maxOccupancy, entry.occupancy),
        });
      }

      // Generate all hours from 00:00 to current
      const hours: HourlyData[] = [];
      const currentHour = new Date().getHours();
      
      for (let h = 0; h <= currentHour; h++) {
        const hourStr = h.toString().padStart(2, "0") + ":00";
        const data = hourlyMap.get(hourStr);
        hours.push({
          hour: hourStr,
          in: data?.in || 0,
          out: data?.out || 0,
          occupancy: data?.maxOccupancy || 0,
        });
      }

      return hours;
    },
    refetchInterval: 30000,
  });
}

export function useLiveCountsRealtime() {
  const [latestCounts, setLatestCounts] = useState<Map<string, LiveCountData>>(new Map());

  useEffect(() => {
    const channel = supabase
      .channel("live-counts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_counts",
        },
        (payload) => {
          const newCount = payload.new as {
            camera_id: string;
            timestamp: string;
            in_count: number;
            out_count: number;
            occupancy: number;
          };
          setLatestCounts((prev) => {
            const next = new Map(prev);
            next.set(newCount.camera_id, {
              timestamp: newCount.timestamp,
              in_count: newCount.in_count,
              out_count: newCount.out_count,
              occupancy: newCount.occupancy,
            });
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return latestCounts;
}
