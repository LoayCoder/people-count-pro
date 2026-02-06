import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export interface ReportFilters {
  type: "daily" | "weekly" | "monthly" | "custom";
  startDate: Date;
  endDate: Date;
  siteId?: string;
  cameraId?: string;
}

export interface ReportStats {
  totalIn: number;
  totalOut: number;
  peakOccupancy: number;
  peakTime?: string;
  avgDwellSeconds?: number;
  daysCount: number;
}

export interface DailyData {
  date: string;
  totalIn: number;
  totalOut: number;
  peakOccupancy: number;
  camera?: string;
  site?: string;
}

export function useReportStats(filters: ReportFilters) {
  return useQuery({
    queryKey: ["report-stats", filters],
    queryFn: async () => {
      let query = supabase
        .from("daily_stats")
        .select(`
          *,
          cameras(name),
          sites(name)
        `)
        .gte("date", format(filters.startDate, "yyyy-MM-dd"))
        .lte("date", format(filters.endDate, "yyyy-MM-dd"));

      if (filters.siteId && filters.siteId !== "all") {
        query = query.eq("site_id", filters.siteId);
      }
      if (filters.cameraId && filters.cameraId !== "all") {
        query = query.eq("camera_id", filters.cameraId);
      }

      const { data, error } = await query.order("date", { ascending: true });

      if (error) throw error;

      // Calculate aggregates
      const stats: ReportStats = data?.reduce(
        (acc, stat) => ({
          totalIn: acc.totalIn + (stat.total_in || 0),
          totalOut: acc.totalOut + (stat.total_out || 0),
          peakOccupancy: Math.max(acc.peakOccupancy, stat.peak_occupancy || 0),
          peakTime:
            (stat.peak_occupancy || 0) > acc.peakOccupancy
              ? stat.peak_time
              : acc.peakTime,
          avgDwellSeconds: stat.avg_dwell_seconds || acc.avgDwellSeconds,
          daysCount: acc.daysCount + 1,
        }),
        {
          totalIn: 0,
          totalOut: 0,
          peakOccupancy: 0,
          peakTime: undefined,
          avgDwellSeconds: undefined,
          daysCount: 0,
        } as ReportStats
      ) || {
        totalIn: 0,
        totalOut: 0,
        peakOccupancy: 0,
        daysCount: 0,
      };

      const dailyData: DailyData[] =
        data?.map((stat) => ({
          date: stat.date,
          totalIn: stat.total_in || 0,
          totalOut: stat.total_out || 0,
          peakOccupancy: stat.peak_occupancy || 0,
          camera: stat.cameras?.name,
          site: stat.sites?.name,
        })) || [];

      return { stats, dailyData };
    },
  });
}

export function useHourlyStats(date: Date, cameraId?: string) {
  return useQuery({
    queryKey: ["hourly-stats", format(date, "yyyy-MM-dd"), cameraId],
    queryFn: async () => {
      const startOfSelectedDay = startOfDay(date);
      const endOfSelectedDay = endOfDay(date);

      let query = supabase
        .from("hourly_stats")
        .select("*")
        .gte("hour_start", startOfSelectedDay.toISOString())
        .lte("hour_start", endOfSelectedDay.toISOString());

      if (cameraId && cameraId !== "all") {
        query = query.eq("camera_id", cameraId);
      }

      const { data, error } = await query.order("hour_start", {
        ascending: true,
      });

      if (error) throw error;

      return data?.map((stat) => ({
        hour: format(new Date(stat.hour_start), "HH:mm"),
        totalIn: stat.total_in,
        totalOut: stat.total_out,
        occupancy: stat.total_in - stat.total_out,
        peakOccupancy: stat.peak_occupancy,
      })) || [];
    },
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      filters,
      format: exportFormat,
    }: {
      filters: ReportFilters;
      format: "csv" | "json";
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-report",
        {
          body: {
            type: filters.type,
            format: exportFormat,
            start_date: format(filters.startDate, "yyyy-MM-dd"),
            end_date: format(filters.endDate, "yyyy-MM-dd"),
            site_id: filters.siteId !== "all" ? filters.siteId : undefined,
            camera_id: filters.cameraId !== "all" ? filters.cameraId : undefined,
          },
        }
      );

      if (error) throw error;

      return data;
    },
    onSuccess: (data, variables) => {
      if (variables.format === "csv") {
        // Download CSV
        const blob = new Blob([data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_${format(variables.filters.startDate, "yyyy-MM-dd")}_${format(variables.filters.endDate, "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Report exported successfully");
      } else {
        toast.success("Report generated successfully");
      }
    },
    onError: (error) => {
      toast.error(`Failed to export report: ${error.message}`);
    },
  });
}

export function getDateRangeForType(type: "daily" | "weekly" | "monthly" | "custom") {
  const today = new Date();
  
  switch (type) {
    case "daily":
      return { startDate: startOfDay(today), endDate: endOfDay(today) };
    case "weekly":
      return { startDate: startOfWeek(today), endDate: endOfWeek(today) };
    case "monthly":
      return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
    default:
      return { startDate: subDays(today, 7), endDate: today };
  }
}
