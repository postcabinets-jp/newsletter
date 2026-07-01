export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          plan: "free" | "pro" | "enterprise";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          plan?: "free" | "pro" | "enterprise";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: never[];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "editor" | "analyst";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "editor" | "analyst";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_members"]["Insert"]>;
        Relationships: never[];
      };
      publications: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          description: string | null;
          custom_domain: string | null;
          smtp_config: Json | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          description?: string | null;
          custom_domain?: string | null;
          smtp_config?: Json | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["publications"]["Insert"]>;
        Relationships: never[];
      };
      subscribers: {
        Row: {
          id: string;
          publication_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          status: "active" | "unsubscribed" | "bounced" | "complained" | "pending";
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          metadata: Json;
          subscribed_at: string;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          status?: "active" | "unsubscribed" | "bounced" | "complained" | "pending";
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          metadata?: Json;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscribers"]["Insert"]>;
        Relationships: never[];
      };
      tags: {
        Row: {
          id: string;
          publication_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Insert"]>;
        Relationships: never[];
      };
      subscriber_tags: {
        Row: {
          subscriber_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          subscriber_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriber_tags"]["Insert"]>;
        Relationships: never[];
      };
      campaigns: {
        Row: {
          id: string;
          publication_id: string;
          subject: string;
          preview_text: string | null;
          content_json: Json;
          content_html: string | null;
          status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
          send_at: string | null;
          sent_at: string | null;
          segment_filter: Json | null;
          ab_test: Json | null;
          stats: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          subject: string;
          preview_text?: string | null;
          content_json?: Json;
          content_html?: string | null;
          status?: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
          send_at?: string | null;
          sent_at?: string | null;
          segment_filter?: Json | null;
          ab_test?: Json | null;
          stats?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: never[];
      };
      campaign_events: {
        Row: {
          id: string;
          campaign_id: string;
          subscriber_id: string;
          event_type: "delivered" | "open" | "click" | "unsubscribe" | "bounce" | "complaint" | "spam_report";
          url: string | null;
          user_agent: string | null;
          ip_address: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          subscriber_id: string;
          event_type: "delivered" | "open" | "click" | "unsubscribe" | "bounce" | "complaint" | "spam_report";
          url?: string | null;
          user_agent?: string | null;
          ip_address?: string | null;
          occurred_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_events"]["Insert"]>;
        Relationships: never[];
      };
      automations: {
        Row: {
          id: string;
          publication_id: string;
          name: string;
          trigger_type: "subscriber_added" | "tag_added" | "tag_removed" | "paid_subscription_started" | "paid_subscription_cancelled" | "campaign_link_clicked";
          trigger_config: Json;
          flow_json: Json;
          status: "draft" | "active" | "paused";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          name: string;
          trigger_type: "subscriber_added" | "tag_added" | "tag_removed" | "paid_subscription_started" | "paid_subscription_cancelled" | "campaign_link_clicked";
          trigger_config?: Json;
          flow_json?: Json;
          status?: "draft" | "active" | "paused";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["automations"]["Insert"]>;
        Relationships: never[];
      };
      automation_enrollments: {
        Row: {
          id: string;
          automation_id: string;
          subscriber_id: string;
          current_step_id: string | null;
          status: "active" | "completed" | "paused" | "cancelled";
          enrolled_at: string;
          next_step_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          automation_id: string;
          subscriber_id: string;
          current_step_id?: string | null;
          status?: "active" | "completed" | "paused" | "cancelled";
          enrolled_at?: string;
          next_step_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["automation_enrollments"]["Insert"]>;
        Relationships: never[];
      };
      forms: {
        Row: {
          id: string;
          publication_id: string;
          name: string;
          type: "inline" | "popup" | "standalone";
          config: Json;
          embed_code: string | null;
          total_views: number;
          total_signups: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          name: string;
          type?: "inline" | "popup" | "standalone";
          config?: Json;
          embed_code?: string | null;
          total_views?: number;
          total_signups?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["forms"]["Insert"]>;
        Relationships: never[];
      };
      subscription_plans: {
        Row: {
          id: string;
          publication_id: string;
          name: string;
          description: string | null;
          stripe_price_id: string;
          amount_cents: number;
          currency: string;
          interval: "month" | "year" | "one_time";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          publication_id: string;
          name: string;
          description?: string | null;
          stripe_price_id: string;
          amount_cents: number;
          currency?: string;
          interval: "month" | "year" | "one_time";
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscription_plans"]["Insert"]>;
        Relationships: never[];
      };
      subscriber_subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: "active" | "past_due" | "cancelled" | "trialing";
          current_period_start: string | null;
          current_period_end: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscriber_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status: "active" | "past_due" | "cancelled" | "trialing";
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriber_subscriptions"]["Insert"]>;
        Relationships: never[];
      };
      api_keys: {
        Row: {
          id: string;
          publication_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          created_by: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          publication_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: never[];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
  };
}

// Convenience row types
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Publication = Database["public"]["Tables"]["publications"]["Row"];
export type Subscriber = Database["public"]["Tables"]["subscribers"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignEvent = Database["public"]["Tables"]["campaign_events"]["Row"];
export type Automation = Database["public"]["Tables"]["automations"]["Row"];
export type Form = Database["public"]["Tables"]["forms"]["Row"];
export type SubscriptionPlan = Database["public"]["Tables"]["subscription_plans"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
