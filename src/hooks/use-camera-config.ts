import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ROIPolygon, CountingLine, Zone } from "@/components/configurator/DrawingCanvas";
import type { Json } from "@/integrations/supabase/types";

interface CameraConfig {
  id: string;
  camera_id: string;
  roi_json: ROIPolygon[];
  line_json: CountingLine[];
  zone_json: Zone[];
  thresholds_json: {
    confidence: number;
    min_track_age: number;
    max_lost_frames: number;
  };
  version: number;
  updated_at: string;
}

interface RawCameraConfig {
  id: string;
  camera_id: string;
  roi_json: Json | null;
  line_json: Json | null;
  zone_json: Json | null;
  thresholds_json: Json | null;
  version: number;
  updated_at: string;
  created_at: string;
}

const defaultThresholds = {
  confidence: 0.5,
  min_track_age: 3,
  max_lost_frames: 30,
};

function parseConfig(raw: RawCameraConfig): CameraConfig {
  return {
    id: raw.id,
    camera_id: raw.camera_id,
    roi_json: (raw.roi_json as unknown as ROIPolygon[]) || [],
    line_json: (raw.line_json as unknown as CountingLine[]) || [],
    zone_json: (raw.zone_json as unknown as Zone[]) || [],
    thresholds_json: (raw.thresholds_json as unknown as CameraConfig["thresholds_json"]) || defaultThresholds,
    version: raw.version,
    updated_at: raw.updated_at,
  };
}

export function useCameraConfig(cameraId: string | null) {
  return useQuery({
    queryKey: ["camera-config", cameraId],
    queryFn: async (): Promise<CameraConfig | null> => {
      if (!cameraId) return null;
      
      const { data, error } = await supabase
        .from("camera_configs")
        .select("*")
        .eq("camera_id", cameraId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return parseConfig(data as RawCameraConfig);
    },
    enabled: !!cameraId,
  });
}

export function useSaveCameraConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cameraId,
      rois,
      lines,
      zones,
      thresholds,
    }: {
      cameraId: string;
      rois: ROIPolygon[];
      lines: CountingLine[];
      zones: Zone[];
      thresholds: CameraConfig["thresholds_json"];
    }) => {
      // Check if config exists
      const { data: existing } = await supabase
        .from("camera_configs")
        .select("id, version")
        .eq("camera_id", cameraId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("camera_configs")
          .update({
            roi_json: rois as unknown as Json,
            line_json: lines as unknown as Json,
            zone_json: zones as unknown as Json,
            thresholds_json: thresholds as unknown as Json,
            version: existing.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("camera_configs")
          .insert({
            camera_id: cameraId,
            roi_json: rois as unknown as Json,
            line_json: lines as unknown as Json,
            zone_json: zones as unknown as Json,
            thresholds_json: thresholds as unknown as Json,
            version: 1,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["camera-config", variables.cameraId] });
      toast.success("Configuration saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save configuration: " + error.message);
    },
  });
}

export function useDeleteCameraConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cameraId: string) => {
      const { error } = await supabase
        .from("camera_configs")
        .delete()
        .eq("camera_id", cameraId);

      if (error) throw error;
    },
    onSuccess: (_, cameraId) => {
      queryClient.invalidateQueries({ queryKey: ["camera-config", cameraId] });
      toast.success("Configuration deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete configuration: " + error.message);
    },
  });
}
