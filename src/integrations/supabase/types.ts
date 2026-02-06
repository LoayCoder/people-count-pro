export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alert_rules: {
        Row: {
          camera_id: string | null
          created_at: string
          enabled: boolean
          id: string
          name: string
          notify_email: boolean
          site_id: string | null
          threshold_value: number | null
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          camera_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          notify_email?: boolean
          site_id?: string | null
          threshold_value?: number | null
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          camera_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          notify_email?: boolean
          site_id?: string | null
          threshold_value?: number | null
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alert_rules_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_rules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          camera_id: string | null
          closed_at: string | null
          created_at: string
          id: string
          message: string
          severity: Database["public"]["Enums"]["alert_severity"]
          site_id: string | null
          status: Database["public"]["Enums"]["alert_status"]
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          camera_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          camera_id?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          site_id?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      camera_configs: {
        Row: {
          camera_id: string
          created_at: string
          id: string
          line_json: Json | null
          roi_json: Json | null
          thresholds_json: Json | null
          updated_at: string
          version: number
          zone_json: Json | null
        }
        Insert: {
          camera_id: string
          created_at?: string
          id?: string
          line_json?: Json | null
          roi_json?: Json | null
          thresholds_json?: Json | null
          updated_at?: string
          version?: number
          zone_json?: Json | null
        }
        Update: {
          camera_id?: string
          created_at?: string
          id?: string
          line_json?: Json | null
          roi_json?: Json | null
          thresholds_json?: Json | null
          updated_at?: string
          version?: number
          zone_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_configs_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: true
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          input_type: Database["public"]["Enums"]["camera_input_type"]
          last_seen_at: string | null
          last_snapshot_url: string | null
          name: string
          rtsp_url: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["camera_status"]
          stream_type: string | null
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          input_type?: Database["public"]["Enums"]["camera_input_type"]
          last_seen_at?: string | null
          last_snapshot_url?: string | null
          name: string
          rtsp_url?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["camera_status"]
          stream_type?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          input_type?: Database["public"]["Enums"]["camera_input_type"]
          last_seen_at?: string | null
          last_snapshot_url?: string | null
          name?: string
          rtsp_url?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["camera_status"]
          stream_type?: string | null
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cameras_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cameras_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      counting_events: {
        Row: {
          camera_id: string
          confidence: number | null
          created_at: string
          direction: string
          event_date: string
          id: string
          line_id: string | null
          timestamp: string
          track_id: string
          zone_id: string | null
        }
        Insert: {
          camera_id: string
          confidence?: number | null
          created_at?: string
          direction: string
          event_date?: string
          id?: string
          line_id?: string | null
          timestamp?: string
          track_id: string
          zone_id?: string | null
        }
        Update: {
          camera_id?: string
          confidence?: number | null
          created_at?: string
          direction?: string
          event_date?: string
          id?: string
          line_id?: string | null
          timestamp?: string
          track_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counting_events_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counting_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_stats: {
        Row: {
          avg_dwell_seconds: number | null
          camera_id: string | null
          created_at: string
          date: string
          id: string
          peak_occupancy: number
          peak_time: string | null
          site_id: string | null
          total_in: number
          total_out: number
        }
        Insert: {
          avg_dwell_seconds?: number | null
          camera_id?: string | null
          created_at?: string
          date: string
          id?: string
          peak_occupancy?: number
          peak_time?: string | null
          site_id?: string | null
          total_in?: number
          total_out?: number
        }
        Update: {
          avg_dwell_seconds?: number | null
          camera_id?: string | null
          created_at?: string
          date?: string
          id?: string
          peak_occupancy?: number
          peak_time?: string | null
          site_id?: string | null
          total_in?: number
          total_out?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_stats_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_stats_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      dwell_stats: {
        Row: {
          camera_id: string
          dwell_seconds: number
          entered_at: string
          exited_at: string | null
          id: string
          track_id: string
          zone_id: string | null
        }
        Insert: {
          camera_id: string
          dwell_seconds?: number
          entered_at?: string
          exited_at?: string | null
          id?: string
          track_id: string
          zone_id?: string | null
        }
        Update: {
          camera_id?: string
          dwell_seconds?: number
          entered_at?: string
          exited_at?: string | null
          id?: string
          track_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dwell_stats_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dwell_stats_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      hourly_stats: {
        Row: {
          avg_dwell_seconds: number | null
          camera_id: string | null
          created_at: string
          hour_start: string
          id: string
          peak_occupancy: number
          site_id: string | null
          total_in: number
          total_out: number
          zone_id: string | null
        }
        Insert: {
          avg_dwell_seconds?: number | null
          camera_id?: string | null
          created_at?: string
          hour_start: string
          id?: string
          peak_occupancy?: number
          site_id?: string | null
          total_in?: number
          total_out?: number
          zone_id?: string | null
        }
        Update: {
          avg_dwell_seconds?: number | null
          camera_id?: string | null
          created_at?: string
          hour_start?: string
          id?: string
          peak_occupancy?: number
          site_id?: string | null
          total_in?: number
          total_out?: number
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hourly_stats_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_stats_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_stats_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      live_counts: {
        Row: {
          camera_id: string
          id: string
          in_count: number
          occupancy: number
          out_count: number
          timestamp: string
        }
        Insert: {
          camera_id: string
          id?: string
          in_count?: number
          occupancy?: number
          out_count?: number
          timestamp?: string
        }
        Update: {
          camera_id?: string
          id?: string
          in_count?: number
          occupancy?: number
          out_count?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_counts_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recorded_jobs: {
        Row: {
          camera_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          line_config_json: Json | null
          progress: number | null
          result_json: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          video_name: string
          video_url: string | null
        }
        Insert: {
          camera_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          line_config_json?: Json | null
          progress?: number | null
          result_json?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          video_name: string
          video_url?: string | null
        }
        Update: {
          camera_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          line_config_json?: Json | null
          progress?: number | null
          result_json?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          video_name?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recorded_jobs_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          timezone: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          timezone?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          timezone?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          created_at: string
          id: string
          max_occupancy: number | null
          name: string
          site_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_occupancy?: number | null
          name: string
          site_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_occupancy?: number | null
          name?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "low" | "medium" | "high" | "critical"
      alert_status: "new" | "acknowledged" | "closed"
      alert_type:
        | "occupancy_threshold"
        | "spike_detected"
        | "camera_offline"
        | "worker_failure"
      app_role: "admin" | "operator" | "viewer"
      camera_input_type: "live_rtsp" | "recorded_file"
      camera_status: "online" | "offline" | "processing" | "error"
      job_status: "pending" | "processing" | "completed" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["low", "medium", "high", "critical"],
      alert_status: ["new", "acknowledged", "closed"],
      alert_type: [
        "occupancy_threshold",
        "spike_detected",
        "camera_offline",
        "worker_failure",
      ],
      app_role: ["admin", "operator", "viewer"],
      camera_input_type: ["live_rtsp", "recorded_file"],
      camera_status: ["online", "offline", "processing", "error"],
      job_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
