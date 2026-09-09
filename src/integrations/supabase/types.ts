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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_snapshots: {
        Row: {
          captured_at: string
          comments: number
          id: string
          likes: number
          post_id: string | null
          reach: number
          saves: number
          shares: number
        }
        Insert: {
          captured_at?: string
          comments?: number
          id?: string
          likes?: number
          post_id?: string | null
          reach?: number
          saves?: number
          shares?: number
        }
        Update: {
          captured_at?: string
          comments?: number
          id?: string
          likes?: number
          post_id?: string | null
          reach?: number
          saves?: number
          shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          actor_id: string | null
          actor_label: string
          comment: string
          created_at: string
          decision: Database["public"]["Enums"]["approval_decision"]
          id: string
          post_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_label?: string
          comment?: string
          created_at?: string
          decision: Database["public"]["Enums"]["approval_decision"]
          id?: string
          post_id: string
        }
        Update: {
          actor_id?: string | null
          actor_label?: string
          comment?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["approval_decision"]
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_posts: {
        Row: {
          author_id: string | null
          author_label: string
          body: string
          channel: string
          created_at: string
          format: string
          hashtags: string[]
          headline: string
          id: string
          image_url: string | null
          news_item_id: string | null
          published_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["post_status"]
          topics: string[]
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_label?: string
          body?: string
          channel?: string
          created_at?: string
          format?: string
          hashtags?: string[]
          headline?: string
          id?: string
          image_url?: string | null
          news_item_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          topics?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_label?: string
          body?: string
          channel?: string
          created_at?: string
          format?: string
          hashtags?: string[]
          headline?: string
          id?: string
          image_url?: string | null
          news_item_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          topics?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_posts_news_item_id_fkey"
            columns: ["news_item_id"]
            isOneToOne: false
            referencedRelation: "news_items"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          published_at: string
          relevance_score: number
          source_id: string | null
          status: Database["public"]["Enums"]["news_item_status"]
          summary: string
          title: string
          topic: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          published_at?: string
          relevance_score?: number
          source_id?: string | null
          status?: Database["public"]["Enums"]["news_item_status"]
          summary?: string
          title: string
          topic?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          published_at?: string
          relevance_score?: number
          source_id?: string | null
          status?: Database["public"]["Enums"]["news_item_status"]
          summary?: string
          title?: string
          topic?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          job_title: string
          notify_approvals: boolean
          notify_digest: boolean
          notify_publishing: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          job_title?: string
          notify_approvals?: boolean
          notify_digest?: boolean
          notify_publishing?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          job_title?: string
          notify_approvals?: boolean
          notify_digest?: boolean
          notify_publishing?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          fetch_frequency_minutes: number
          id: string
          last_checked_at: string | null
          name: string
          topics: string[]
          type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          fetch_frequency_minutes?: number
          id?: string
          last_checked_at?: string | null
          name: string
          topics?: string[]
          type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          fetch_frequency_minutes?: number
          id?: string
          last_checked_at?: string | null
          name?: string
          topics?: string[]
          type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      approval_decision: "approved" | "changes_requested" | "rejected"
      news_item_status: "new" | "triaged" | "dismissed"
      post_status:
        | "draft"
        | "in_review"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected"
      source_type: "rss" | "website" | "api" | "newsletter"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "editor"],
      approval_decision: ["approved", "changes_requested", "rejected"],
      news_item_status: ["new", "triaged", "dismissed"],
      post_status: [
        "draft",
        "in_review",
        "approved",
        "scheduled",
        "published",
        "rejected",
      ],
      source_type: ["rss", "website", "api", "newsletter"],
    },
  },
} as const
