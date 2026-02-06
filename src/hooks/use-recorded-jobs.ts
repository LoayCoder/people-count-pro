import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type RecordedJob = Tables<"recorded_jobs">;
type RecordedJobInsert = TablesInsert<"recorded_jobs">;

export interface JobResult {
  totalIn: number;
  totalOut: number;
  peakOccupancy: number;
  avgDwellSeconds: number;
  confidence: number;
  hourlyBreakdown?: Array<{ hour: number; in: number; out: number }>;
}

export function useRecordedJobs() {
  return useQuery({
    queryKey: ["recorded-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recorded_jobs")
        .select(`
          *,
          camera:cameras(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useRecordedJob(id: string | undefined) {
  return useQuery({
    queryKey: ["recorded-jobs", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("recorded_jobs")
        .select(`
          *,
          camera:cameras(id, name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRecordedJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (job: RecordedJobInsert) => {
      const { data, error } = await supabase
        .from("recorded_jobs")
        .insert(job)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recorded-jobs"] });
      toast({
        title: "Job created",
        description: "Video processing job has been created.",
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

export function useDeleteRecordedJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First get the job to find the video URL
      const { data: job } = await supabase
        .from("recorded_jobs")
        .select("video_url")
        .eq("id", id)
        .single();

      // Delete from storage if video exists
      if (job?.video_url) {
        const path = job.video_url.split("/").pop();
        if (path) {
          await supabase.storage.from("video-uploads").remove([path]);
        }
      }

      // Delete the job record
      const { error } = await supabase.from("recorded_jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recorded-jobs"] });
      toast({
        title: "Job deleted",
        description: "The processing job has been deleted.",
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

export function useProcessVideo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ jobId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process video");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recorded-jobs"] });
      toast({
        title: "Processing started",
        description: "Video analysis has begun. You'll see results when complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Real-time subscription for job updates
export function useRecordedJobsRealtime() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel("recorded-jobs-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "recorded_jobs",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["recorded-jobs"] });

          const job = payload.new as RecordedJob;
          if (job.status === "completed") {
            toast({
              title: "Processing complete",
              description: `Video "${job.video_name}" has finished processing.`,
            });
          } else if (job.status === "failed") {
            toast({
              title: "Processing failed",
              description: job.error_message || "An error occurred during processing.",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);
}
