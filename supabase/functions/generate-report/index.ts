import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  type: "daily" | "weekly" | "monthly" | "custom";
  format: "csv" | "json";
  start_date: string;
  end_date: string;
  site_id?: string;
  camera_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ReportRequest = await req.json();
    const { type, format, start_date, end_date, site_id, camera_id } = body;

    // Build query for daily stats
    let query = supabase
      .from("daily_stats")
      .select(`
        *,
        cameras(name),
        sites(name)
      `)
      .gte("date", start_date)
      .lte("date", end_date)
      .order("date", { ascending: true });

    if (site_id) {
      query = query.eq("site_id", site_id);
    }
    if (camera_id) {
      query = query.eq("camera_id", camera_id);
    }

    const { data: dailyStats, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate aggregates
    const totals = dailyStats?.reduce(
      (acc, stat) => ({
        total_in: acc.total_in + (stat.total_in || 0),
        total_out: acc.total_out + (stat.total_out || 0),
        peak_occupancy: Math.max(acc.peak_occupancy, stat.peak_occupancy || 0),
      }),
      { total_in: 0, total_out: 0, peak_occupancy: 0 }
    ) || { total_in: 0, total_out: 0, peak_occupancy: 0 };

    const reportData = {
      generated_at: new Date().toISOString(),
      report_type: type,
      date_range: { start: start_date, end: end_date },
      summary: {
        ...totals,
        avg_daily_in: dailyStats?.length
          ? Math.round(totals.total_in / dailyStats.length)
          : 0,
        avg_daily_out: dailyStats?.length
          ? Math.round(totals.total_out / dailyStats.length)
          : 0,
        days_covered: dailyStats?.length || 0,
      },
      daily_breakdown: dailyStats?.map((stat) => ({
        date: stat.date,
        camera: stat.cameras?.name || "Unknown",
        site: stat.sites?.name || "Unknown",
        total_in: stat.total_in,
        total_out: stat.total_out,
        peak_occupancy: stat.peak_occupancy,
        peak_time: stat.peak_time,
      })),
    };

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date",
        "Camera",
        "Site",
        "Total IN",
        "Total OUT",
        "Peak Occupancy",
        "Peak Time",
      ];
      const rows = reportData.daily_breakdown?.map((row) => [
        row.date,
        row.camera,
        row.site,
        row.total_in,
        row.total_out,
        row.peak_occupancy,
        row.peak_time || "",
      ]);

      const csv = [
        `# Report Generated: ${reportData.generated_at}`,
        `# Type: ${type}`,
        `# Date Range: ${start_date} to ${end_date}`,
        `# Summary: Total IN=${totals.total_in}, Total OUT=${totals.total_out}, Peak=${totals.peak_occupancy}`,
        "",
        headers.join(","),
        ...(rows?.map((row) => row.join(",")) || []),
      ].join("\n");

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="report_${type}_${start_date}_${end_date}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
