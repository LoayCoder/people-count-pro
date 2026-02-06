import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Camera = Tables<"cameras">;
type CameraInsert = TablesInsert<"cameras">;
type CameraUpdate = TablesUpdate<"cameras">;

export function useCameras() {
  return useQuery({
    queryKey: ["cameras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cameras")
        .select(`
          *,
          site:sites(id, name),
          zone:zones(id, name, max_occupancy)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCamera(id: string | undefined) {
  return useQuery({
    queryKey: ["cameras", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("cameras")
        .select(`
          *,
          site:sites(id, name),
          zone:zones(id, name, max_occupancy),
          config:camera_configs(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCameraStats() {
  return useQuery({
    queryKey: ["camera-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cameras")
        .select("status, enabled");

      if (error) throw error;

      const stats = {
        total: data.length,
        online: data.filter((c) => c.status === "online").length,
        offline: data.filter((c) => c.status === "offline").length,
        processing: data.filter((c) => c.status === "processing").length,
        error: data.filter((c) => c.status === "error").length,
        enabled: data.filter((c) => c.enabled).length,
        disabled: data.filter((c) => !c.enabled).length,
      };

      return stats;
    },
  });
}

export function useCreateCamera() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (camera: CameraInsert) => {
      const { data, error } = await supabase
        .from("cameras")
        .insert(camera)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["camera-stats"] });
      toast({
        title: "Camera added",
        description: "The camera has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCamera() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CameraUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cameras")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["cameras", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["camera-stats"] });
      toast({
        title: "Camera updated",
        description: "The camera has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteCamera() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cameras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["camera-stats"] });
      toast({
        title: "Camera deleted",
        description: "The camera has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useToggleCameraEnabled() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { data, error } = await supabase
        .from("cameras")
        .update({ enabled })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      queryClient.invalidateQueries({ queryKey: ["camera-stats"] });
      toast({
        title: data.enabled ? "Camera enabled" : "Camera disabled",
        description: `${data.name} has been ${data.enabled ? "enabled" : "disabled"}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
