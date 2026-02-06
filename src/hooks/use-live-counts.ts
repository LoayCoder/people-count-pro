import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface OccupancyData {
  cameraId: string;
  cameraName: string;
  currentOccupancy: number;
  totalIn: number;
  totalOut: number;
  lastUpdated: string | null;
}

interface TimeSeriesPoint {
  time: string;
  occupancy: number;
  in: number;
  out: number;
}

export function useLiveCounts(cameraId?: string) {
  return useQuery({
    queryKey: ["live-counts", cameraId],
    queryFn: async () => {
      let query = supabase
        .from("live_counts")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (cameraId) {
        query = query.eq("camera_id", cameraId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // Fallback polling every 10 seconds
  });
}

export function useCurrentOccupancy() {
  return useQuery({
    queryKey: ["current-occupancy"],
    queryFn: async () => {
      // Get cameras with their latest counts
      const { data: cameras, error: camerasError } = await supabase
        .from("cameras")
        .select("id, name");

      if (camerasError) throw camerasError;

      // Get today's counts for each camera
      const today = new Date().toISOString().split("T")[0];

      const occupancyData: OccupancyData[] = await Promise.all(
        cameras.map(async (camera) => {
          const { data: counts, error } = await supabase
            .from("live_counts")
            .select("in_count, out_count, occupancy, timestamp")
            .eq("camera_id", camera.id)
            .gte("timestamp", `${today}T00:00:00`)
            .order("timestamp", { ascending: false })
            .limit(1);

          if (error) {
            console.error("Error fetching counts for camera", camera.id, error);
            return {
              cameraId: camera.id,
              cameraName: camera.name,
              currentOccupancy: 0,
              totalIn: 0,
              totalOut: 0,
              lastUpdated: null,
            };
          }

          const latest = counts?.[0];
          return {
            cameraId: camera.id,
            cameraName: camera.name,
            currentOccupancy: latest?.occupancy ?? 0,
            totalIn: latest?.in_count ?? 0,
            totalOut: latest?.out_count ?? 0,
            lastUpdated: latest?.timestamp ?? null,
          };
        })
      );

      // Calculate totals
      const totals = occupancyData.reduce(
        (acc, curr) => ({
          totalOccupancy: acc.totalOccupancy + curr.currentOccupancy,
          totalIn: acc.totalIn + curr.totalIn,
          totalOut: acc.totalOut + curr.totalOut,
        }),
        { totalOccupancy: 0, totalIn: 0, totalOut: 0 }
      );

      return {
        cameras: occupancyData,
        totals,
      };
    },
    refetchInterval: 10000,
  });
}

export function useOccupancyTimeSeries(cameraId?: string, hours: number = 24) {
  return useQuery({
    queryKey: ["occupancy-time-series", cameraId, hours],
    queryFn: async () => {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      let query = supabase
        .from("live_counts")
        .select("timestamp, occupancy, in_count, out_count")
        .gte("timestamp", startTime.toISOString())
        .order("timestamp", { ascending: true });

      if (cameraId) {
        query = query.eq("camera_id", cameraId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by hour
      const hourlyData: Record<string, TimeSeriesPoint> = {};

      data.forEach((point) => {
        const hour = new Date(point.timestamp).toISOString().slice(0, 13) + ":00";
        if (!hourlyData[hour]) {
          hourlyData[hour] = {
            time: new Date(hour).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            occupancy: 0,
            in: 0,
            out: 0,
          };
        }
        // Use latest values for this hour
        hourlyData[hour].occupancy = point.occupancy;
        hourlyData[hour].in += point.in_count;
        hourlyData[hour].out += point.out_count;
      });

      return Object.values(hourlyData);
    },
    refetchInterval: 60000, // Refresh every minute for time series
  });
}

// Real-time subscription for live counts
export function useLiveCountsRealtime(cameraId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("live-counts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_counts",
          ...(cameraId && { filter: `camera_id=eq.${cameraId}` }),
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-counts"] });
          queryClient.invalidateQueries({ queryKey: ["current-occupancy"] });
          queryClient.invalidateQueries({ queryKey: ["occupancy-time-series"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cameraId, queryClient]);
}
