import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

type Alert = Tables<"alerts">;
type AlertUpdate = TablesUpdate<"alerts">;
type AlertStatus = "new" | "acknowledged" | "closed";

export function useAlerts(options?: { status?: AlertStatus; limit?: number }) {
  return useQuery({
    queryKey: ["alerts", options],
    queryFn: async () => {
      let query = supabase
        .from("alerts")
        .select(`
          *,
          camera:cameras(id, name),
          site:sites(id, name)
        `)
        .order("created_at", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAlertStats() {
  return useQuery({
    queryKey: ["alert-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("status, severity");

      if (error) throw error;

      const stats = {
        total: data.length,
        new: data.filter((a) => a.status === "new").length,
        acknowledged: data.filter((a) => a.status === "acknowledged").length,
        closed: data.filter((a) => a.status === "closed").length,
        critical: data.filter((a) => a.severity === "critical" && a.status === "new").length,
        high: data.filter((a) => a.severity === "high" && a.status === "new").length,
      };

      return stats;
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("alerts")
        .update({
          status: "acknowledged",
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
      toast({
        title: "Alert acknowledged",
        description: "The alert has been acknowledged.",
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

export function useCloseAlert() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("alerts")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
      toast({
        title: "Alert closed",
        description: "The alert has been closed.",
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

// Real-time subscription hook for new alerts
export function useAlertsRealtime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["alert-stats"] });

          const alert = payload.new as Alert;
          if (alert.severity === "critical" || alert.severity === "high") {
            toast({
              title: `${alert.severity.toUpperCase()} Alert`,
              description: alert.message,
              variant: "destructive",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["alert-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);
}
