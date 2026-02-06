import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface SystemSettings {
  demo_mode?: boolean;
  auto_refresh?: boolean;
  dark_mode?: boolean;
  occupancy_alerts?: boolean;
  spike_alerts?: boolean;
  camera_offline_alerts?: boolean;
  system_alerts?: boolean;
  in_app_notifications?: boolean;
  email_notifications?: boolean;
  alert_email?: string;
  detection_model?: string;
  tracking_algorithm?: string;
  max_workers?: number;
  gpu_acceleration?: string;
  counting_data_retention?: number;
  snapshot_retention?: number;
  store_camera_snapshots?: boolean;
  store_alert_snapshots?: boolean;
}

const defaultSettings: SystemSettings = {
  demo_mode: false,
  auto_refresh: true,
  dark_mode: true,
  occupancy_alerts: true,
  spike_alerts: true,
  camera_offline_alerts: true,
  system_alerts: true,
  in_app_notifications: true,
  email_notifications: false,
  alert_email: "",
  detection_model: "yolov8",
  tracking_algorithm: "bytetrack",
  max_workers: 4,
  gpu_acceleration: "auto",
  counting_data_retention: 90,
  snapshot_retention: 7,
  store_camera_snapshots: true,
  store_alert_snapshots: true,
};

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value");

      if (error) throw error;

      // Convert array to object
      const settingsObj: SystemSettings = { ...defaultSettings };
      data?.forEach((item) => {
        const key = item.key as keyof SystemSettings;
        const value = item.value as Json;
        if (key in defaultSettings) {
          (settingsObj as Record<string, unknown>)[key] = value;
        }
      });

      return settingsObj;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({
      key,
      value,
    }: {
      key: keyof SystemSettings;
      value: SystemSettings[keyof SystemSettings];
    }) => {
      const { error } = await supabase.from("system_settings").upsert(
        {
          key,
          value: value as Json,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });

  const updateMultipleSettings = useMutation({
    mutationFn: async (updates: Partial<SystemSettings>) => {
      const entries = Object.entries(updates);
      for (const [key, value] of entries) {
        const { error } = await supabase.from("system_settings").upsert(
          {
            key,
            value: value as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  return {
    settings: settings || defaultSettings,
    isLoading,
    updateSetting,
    updateMultipleSettings,
  };
}
