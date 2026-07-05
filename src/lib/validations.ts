import { z } from "zod";

// ── Campaign Schemas ──

export const CreateCampaignSchema = z.object({
  subject: z.string().min(1, "件名を入力してください"),
  preview_text: z.string().optional(),
  content_html: z.string().optional(),
  content_json: z.record(z.string(), z.unknown()).optional(),
});

export const UpdateCampaignSchema = z.object({
  id: z.string().uuid("有効なキャンペーンIDを指定してください"),
  subject: z.string().min(1, "件名を入力してください").optional(),
  preview_text: z.string().optional(),
  content_html: z.string().optional(),
  content_json: z.record(z.string(), z.unknown()).optional(),
});

export const ScheduleCampaignSchema = z.object({
  id: z.string().uuid("有効なキャンペーンIDを指定してください"),
  send_at: z.string().datetime({ offset: true }),
});

export const CampaignIdSchema = z.object({
  id: z.string().uuid("有効なキャンペーンIDを指定してください"),
});

export const CampaignEventSchema = z.object({
  campaign_id: z.string().uuid("有効なキャンペーンIDを指定してください"),
  subscriber_id: z.string().uuid("有効な購読者IDを指定してください"),
  event_type: z.enum([
    "delivered",
    "open",
    "click",
    "unsubscribe",
    "bounce",
    "complaint",
    "spam_report",
  ]),
  url: z.string().url("有効なURLを入力してください").optional(),
});

export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_EVENT_TYPES = [
  "delivered",
  "open",
  "click",
  "unsubscribe",
  "bounce",
  "complaint",
  "spam_report",
] as const;

export type CampaignEventType = (typeof CAMPAIGN_EVENT_TYPES)[number];

// ── Subscriber Schemas ──

export const SUBSCRIBER_STATUSES = [
  "active",
  "unsubscribed",
  "bounced",
  "complained",
  "pending",
] as const;

export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

export const AddSubscriberSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  source: z.string().optional(),
});

export const UpdateSubscriberSchema = z.object({
  id: z.string().uuid("有効な購読者IDを指定してください"),
  email: z.string().email("有効なメールアドレスを入力してください").optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  status: z
    .enum(["active", "unsubscribed", "bounced", "complained", "pending"])
    .optional(),
  source: z.string().optional(),
});

export const DeleteSubscriberSchema = z.object({
  id: z.string().uuid("有効な購読者IDを指定してください"),
});

export const UnsubscribeSchema = z.object({
  id: z.string().uuid("有効な購読者IDを指定してください"),
});

export const ImportCsvRowSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  source: z.string().optional(),
});

// ── Publication / Settings Schemas ──

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const CreatePublicationSchema = z.object({
  org_name: z.string().min(1, "組織名を入力してください"),
  name: z.string().min(1, "パブリケーション名を入力してください"),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .regex(
      SLUG_REGEX,
      "スラッグは小文字英数字とハイフンのみ使用できます"
    ),
  description: z.string().optional(),
});

export const UpdatePublicationSchema = z.object({
  name: z.string().min(1, "パブリケーション名を入力してください").optional(),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .regex(
      SLUG_REGEX,
      "スラッグは小文字英数字とハイフンのみ使用できます"
    )
    .optional(),
  description: z.string().optional(),
});

// ── Tag Schemas ──

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export const CreateTagSchema = z.object({
  name: z.string().min(1, "タグ名を入力してください").max(50, "タグ名は50文字以内にしてください"),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "有効なカラーコードを入力してください")
    .optional(),
});

export const UpdateTagSchema = z.object({
  id: z.string().uuid("有効なタグIDを指定してください"),
  name: z
    .string()
    .min(1, "タグ名を入力してください")
    .max(50, "タグ名は50文字以内にしてください")
    .optional(),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, "有効なカラーコードを入力してください")
    .optional(),
});

export const DeleteTagSchema = z.object({
  id: z.string().uuid("有効なタグIDを指定してください"),
});

export const AssignTagSchema = z.object({
  subscriber_id: z.string().uuid("有効な購読者IDを指定してください"),
  tag_id: z.string().uuid("有効なタグIDを指定してください"),
});

export const BulkAssignTagSchema = z.object({
  subscriber_ids: z.string().transform((s) => {
    const ids = s
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) throw new Error("subscriber_ids が空です");
    ids.forEach((id) => {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )
      ) {
        throw new Error(`不正なUUID: ${id}`);
      }
    });
    return ids;
  }),
  tag_id: z.string().uuid("有効なタグIDを指定してください"),
});

// ── Automation Schemas ──

export const AUTOMATION_TRIGGER_TYPES = [
  "subscriber_added",
  "tag_added",
  "tag_removed",
  "paid_subscription_started",
  "paid_subscription_cancelled",
  "campaign_link_clicked",
] as const;

export type AutomationTriggerType = (typeof AUTOMATION_TRIGGER_TYPES)[number];

export const AUTOMATION_STATUSES = ["draft", "active", "paused"] as const;
export type AutomationStatus = (typeof AUTOMATION_STATUSES)[number];

export const CreateAutomationSchema = z.object({
  name: z.string().min(1, "オートメーション名を入力してください"),
  trigger_type: z.enum([
    "subscriber_added",
    "tag_added",
    "tag_removed",
    "paid_subscription_started",
    "paid_subscription_cancelled",
    "campaign_link_clicked",
  ]),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
  flow_json: z.record(z.string(), z.unknown()).optional(),
});

// ── Form Schemas ──

export const FORM_TYPES = ["inline", "popup", "standalone"] as const;
export type FormType = (typeof FORM_TYPES)[number];

export const CreateFormSchema = z.object({
  name: z.string().min(1, "フォーム名を入力してください"),
  type: z.enum(["inline", "popup", "standalone"]),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ── Subscription Plan Schemas ──

export const PLAN_INTERVALS = ["month", "year", "one_time"] as const;
export type PlanInterval = (typeof PLAN_INTERVALS)[number];

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1, "プラン名を入力してください"),
  description: z.string().optional(),
  stripe_price_id: z.string().min(1, "Stripe Price IDを入力してください"),
  amount_cents: z
    .number()
    .int("金額は整数で入力してください")
    .nonnegative("金額は0以上で入力してください"),
  currency: z.string().length(3, "通貨コードは3文字で入力してください").default("jpy"),
  interval: z.enum(["month", "year", "one_time"]),
});

// ── API Key Schemas ──

export const CreateApiKeySchema = z.object({
  name: z.string().min(1, "API Key名を入力してください").max(100, "API Key名は100文字以内にしてください"),
});

// ── Organization Schemas ──

export const ORGANIZATION_PLANS = ["free", "pro", "enterprise"] as const;
export type OrganizationPlan = (typeof ORGANIZATION_PLANS)[number];

export const MEMBER_ROLES = ["owner", "editor", "analyst"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

// ── Type exports ──

export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;
export type ScheduleCampaignInput = z.infer<typeof ScheduleCampaignSchema>;
export type CampaignEventInput = z.infer<typeof CampaignEventSchema>;
export type AddSubscriberInput = z.infer<typeof AddSubscriberSchema>;
export type UpdateSubscriberInput = z.infer<typeof UpdateSubscriberSchema>;
export type ImportCsvRowInput = z.infer<typeof ImportCsvRowSchema>;
export type CreatePublicationInput = z.infer<typeof CreatePublicationSchema>;
export type UpdatePublicationInput = z.infer<typeof UpdatePublicationSchema>;
export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>;
export type AssignTagInput = z.infer<typeof AssignTagSchema>;
export type CreateAutomationInput = z.infer<typeof CreateAutomationSchema>;
export type CreateFormInput = z.infer<typeof CreateFormSchema>;
export type CreateSubscriptionPlanInput = z.infer<typeof CreateSubscriptionPlanSchema>;
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
