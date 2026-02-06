import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CountEvent {
  camera_id: string;
  track_id: string;
  direction: "in" | "out";
  line_id?: string;
  zone_id?: string;
  confidence?: number;
  timestamp?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate authorization (service role or authenticated user)
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CountEvent | CountEvent[] = await req.json();
    const events = Array.isArray(body) ? body : [body];

    const results = [];
    const errors = [];

    for (const event of events) {
      // Validate required fields
      if (!event.camera_id || !event.track_id || !event.direction) {
        errors.push({
          event,
          error: "Missing required fields: camera_id, track_id, direction",
        });
        continue;
      }

      if (!["in", "out"].includes(event.direction)) {
        errors.push({
          event,
          error: "Direction must be 'in' or 'out'",
        });
        continue;
      }

      // Insert counting event (will be deduplicated by unique constraint)
      const { data: countData, error: countError } = await supabase
        .from("counting_events")
        .upsert(
          {
            camera_id: event.camera_id,
            track_id: event.track_id,
            direction: event.direction,
            line_id: event.line_id,
            zone_id: event.zone_id,
            confidence: event.confidence,
            timestamp: event.timestamp || new Date().toISOString(),
          },
          {
            onConflict: "camera_id,track_id,direction,event_date",
            ignoreDuplicates: true,
          }
        )
        .select();

      if (countError) {
        errors.push({ event, error: countError.message });
        continue;
      }

      // Update live counts
      const { data: existingCount } = await supabase
        .from("live_counts")
        .select("*")
        .eq("camera_id", event.camera_id)
        .gte("timestamp", new Date(Date.now() - 60000).toISOString()) // Last minute
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();

      if (existingCount) {
        // Update existing record
        const newInCount =
          existingCount.in_count + (event.direction === "in" ? 1 : 0);
        const newOutCount =
          existingCount.out_count + (event.direction === "out" ? 1 : 0);

        await supabase
          .from("live_counts")
          .update({
            in_count: newInCount,
            out_count: newOutCount,
            occupancy: newInCount - newOutCount,
            timestamp: new Date().toISOString(),
          })
          .eq("id", existingCount.id);
      } else {
        // Create new record
        await supabase.from("live_counts").insert({
          camera_id: event.camera_id,
          in_count: event.direction === "in" ? 1 : 0,
          out_count: event.direction === "out" ? 1 : 0,
          occupancy: event.direction === "in" ? 1 : -1,
        });
      }

      // Check alert thresholds
      const { data: camera } = await supabase
        .from("cameras")
        .select("*, zones(*)")
        .eq("id", event.camera_id)
        .single();

      if (camera?.zones?.max_occupancy) {
        const { data: latestCount } = await supabase
          .from("live_counts")
          .select("occupancy")
          .eq("camera_id", event.camera_id)
          .order("timestamp", { ascending: false })
          .limit(1)
          .single();

        if (
          latestCount &&
          latestCount.occupancy >= camera.zones.max_occupancy * 0.9
        ) {
          // Create threshold alert
          await supabase.from("alerts").insert({
            camera_id: event.camera_id,
            site_id: camera.site_id,
            type: "occupancy_threshold",
            severity:
              latestCount.occupancy >= camera.zones.max_occupancy
                ? "critical"
                : "high",
            message: `${camera.name} exceeded ${latestCount.occupancy >= camera.zones.max_occupancy ? "100%" : "90%"} capacity (${latestCount.occupancy}/${camera.zones.max_occupancy})`,
          });
        }
      }

      results.push({ success: true, track_id: event.track_id });
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        errors: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: errors.length === events.length ? 400 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing count:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
