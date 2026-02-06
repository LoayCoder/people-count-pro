import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Zone = Tables<"zones">;
type ZoneInsert = TablesInsert<"zones">;
type ZoneUpdate = TablesUpdate<"zones">;

export function useZones(siteId?: string) {
  return useQuery({
    queryKey: ["zones", siteId],
    queryFn: async () => {
      let query = supabase
        .from("zones")
        .select(`
          *,
          site:sites(id, name)
        `)
        .order("name");

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useZone(id: string | undefined) {
  return useQuery({
    queryKey: ["zones", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("zones")
        .select(`
          *,
          site:sites(id, name),
          cameras(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (zone: ZoneInsert) => {
      const { data, error } = await supabase
        .from("zones")
        .insert(zone)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({
        title: "Zone added",
        description: "The zone has been added successfully.",
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

export function useUpdateZone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ZoneUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("zones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["zones", "detail", variables.id] });
      toast({
        title: "Zone updated",
        description: "The zone has been updated successfully.",
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

export function useDeleteZone() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      toast({
        title: "Zone deleted",
        description: "The zone has been deleted successfully.",
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
