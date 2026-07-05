"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  requirePublication,
  wrapAction,
  ActionError,
  type ActionResult,
} from "./helpers";
import type { Json, Database } from "@/types/database";

// ── Schemas ──

const CreateCampaignSchema = z.object({
  subject: z.string().min(1, "件名を入力してください"),
  preview_text: z.string().optional(),
  content_html: z.string().optional(),
  content_json: z.record(z.string(), z.unknown()).optional(),
});

const UpdateCampaignSchema = z.object({
  id: z.string().uuid(),
  subject: z.string().min(1).optional(),
  preview_text: z.string().optional(),
  content_html: z.string().optional(),
  content_json: z.record(z.string(), z.unknown()).optional(),
});

const ScheduleCampaignSchema = z.object({
  id: z.string().uuid(),
  send_at: z.string().datetime({ offset: true }),
});

const CampaignIdSchema = z.object({
  id: z.string().uuid(),
});

// ── Actions ──

export async function createCampaign(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, user, publicationId } = await requirePublication();

    const contentJsonRaw = formData.get("content_json") as string | null;
    let contentJson: Record<string, unknown> | undefined;
    if (contentJsonRaw) {
      try {
        contentJson = JSON.parse(contentJsonRaw);
      } catch {
        throw new ActionError("content_json が不正な JSON です");
      }
    }

    const parsed = CreateCampaignSchema.parse({
      subject: formData.get("subject"),
      preview_text: formData.get("preview_text") || undefined,
      content_html: formData.get("content_html") || undefined,
      content_json: contentJson,
    });

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        publication_id: publicationId,
        subject: parsed.subject.trim(),
        preview_text: parsed.preview_text?.trim() || null,
        content_html: parsed.content_html || null,
        content_json: (parsed.content_json ?? {}) as Json,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) throw new ActionError(error.message);
    revalidatePath("/campaigns");
    return { id: data.id };
  });
}

export async function updateCampaign(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const contentJsonRaw = formData.get("content_json") as string | null;
    let contentJson: Record<string, unknown> | undefined;
    if (contentJsonRaw) {
      try {
        contentJson = JSON.parse(contentJsonRaw);
      } catch {
        throw new ActionError("content_json が不正な JSON です");
      }
    }

    const parsed = UpdateCampaignSchema.parse({
      id: formData.get("id"),
      subject: formData.get("subject") || undefined,
      preview_text: formData.get("preview_text") || undefined,
      content_html: formData.get("content_html") || undefined,
      content_json: contentJson,
    });

    const { id, ...updates } = parsed;

    type CampaignUpdate = Database["public"]["Tables"]["campaigns"]["Update"];
    const payload: CampaignUpdate = {};
    if (updates.subject) payload.subject = updates.subject.trim();
    if (updates.preview_text !== undefined) payload.preview_text = updates.preview_text.trim() || null;
    if (updates.content_html !== undefined) payload.content_html = updates.content_html;
    if (updates.content_json) payload.content_json = updates.content_json as Json;

    if (Object.keys(payload).length === 0) {
      throw new ActionError("更新するフィールドがありません");
    }

    // Only allow editing drafts
    const { data: existing } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", id)
      .eq("publication_id", publicationId)
      .single();

    if (!existing) throw new ActionError("キャンペーンが見つかりません");
    if (existing.status !== "draft") {
      throw new ActionError("送信済み・予約中のキャンペーンは編集できません");
    }

    const { error } = await supabase
      .from("campaigns")
      .update(payload)
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${id}`);
  });
}

export async function deleteCampaign(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { id } = CampaignIdSchema.parse({ id: formData.get("id") });

    // Only delete drafts
    const { data: existing } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", id)
      .eq("publication_id", publicationId)
      .single();

    if (!existing) throw new ActionError("キャンペーンが見つかりません");
    if (existing.status !== "draft") {
      throw new ActionError("下書き以外のキャンペーンは削除できません");
    }

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/campaigns");
  });
}

export async function scheduleCampaign(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const parsed = ScheduleCampaignSchema.parse({
      id: formData.get("id"),
      send_at: formData.get("send_at"),
    });

    // Validate campaign is a draft with content
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("status, content_html")
      .eq("id", parsed.id)
      .eq("publication_id", publicationId)
      .single();

    if (!campaign) throw new ActionError("キャンペーンが見つかりません");
    if (campaign.status !== "draft") {
      throw new ActionError("下書きのキャンペーンのみスケジュールできます");
    }
    if (!campaign.content_html?.trim()) {
      throw new ActionError("本文がないキャンペーンは送信できません");
    }

    const sendAt = new Date(parsed.send_at);
    if (sendAt <= new Date()) {
      throw new ActionError("送信日時は現在時刻より後にしてください");
    }

    const { error } = await supabase
      .from("campaigns")
      .update({ status: "scheduled", send_at: sendAt.toISOString() })
      .eq("id", parsed.id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${parsed.id}`);
  });
}

/**
 * Send a campaign immediately.
 * In production this would enqueue a background job.
 * Here we mark it as "sending", count active subscribers,
 * initialize stats, then mark as "sent".
 */
export async function sendCampaignNow(
  formData: FormData
): Promise<ActionResult<{ recipientCount: number }>> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { id } = CampaignIdSchema.parse({ id: formData.get("id") });

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("status, content_html, segment_filter")
      .eq("id", id)
      .eq("publication_id", publicationId)
      .single();

    if (!campaign) throw new ActionError("キャンペーンが見つかりません");
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new ActionError("送信可能なステータスではありません");
    }
    if (!campaign.content_html?.trim()) {
      throw new ActionError("本文がないキャンペーンは送信できません");
    }

    // Count recipients
    const { count: recipientCount } = await supabase
      .from("subscribers")
      .select("*", { count: "exact", head: true })
      .eq("publication_id", publicationId)
      .eq("status", "active");

    if (!recipientCount || recipientCount === 0) {
      throw new ActionError("アクティブな購読者がいません");
    }

    // Mark as sending -> sent
    const { error } = await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        stats: {
          sent: recipientCount,
          delivered: recipientCount,
          opens: 0,
          clicks: 0,
          unsubscribes: 0,
          bounces: 0,
        },
      })
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);

    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${id}`);
    revalidatePath("/dashboard");
    return { recipientCount };
  });
}

export async function cancelScheduledCampaign(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();
    const { id } = CampaignIdSchema.parse({ id: formData.get("id") });

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", id)
      .eq("publication_id", publicationId)
      .single();

    if (!campaign) throw new ActionError("キャンペーンが見つかりません");
    if (campaign.status !== "scheduled") {
      throw new ActionError("予約中のキャンペーンのみキャンセルできます");
    }

    const { error } = await supabase
      .from("campaigns")
      .update({ status: "draft", send_at: null })
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${id}`);
  });
}

/**
 * Record a campaign event (open, click, etc.)
 * Typically called from a tracking pixel or link redirect endpoint.
 */
export async function recordCampaignEvent(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase } = await requirePublication();

    const schema = z.object({
      campaign_id: z.string().uuid(),
      subscriber_id: z.string().uuid(),
      event_type: z.enum(["delivered", "open", "click", "unsubscribe", "bounce", "complaint", "spam_report"]),
      url: z.string().url().optional(),
    });

    const parsed = schema.parse({
      campaign_id: formData.get("campaign_id"),
      subscriber_id: formData.get("subscriber_id"),
      event_type: formData.get("event_type"),
      url: formData.get("url") || undefined,
    });

    const { error } = await supabase
      .from("campaign_events")
      .insert({
        campaign_id: parsed.campaign_id,
        subscriber_id: parsed.subscriber_id,
        event_type: parsed.event_type,
        url: parsed.url ?? null,
      });

    if (error) throw new ActionError(error.message);

    // Update campaign stats based on event type
    const statsFieldMap: Record<string, string> = {
      open: "opens",
      click: "clicks",
      unsubscribe: "unsubscribes",
      bounce: "bounces",
      delivered: "delivered",
    };
    const statsField = statsFieldMap[parsed.event_type];

    if (statsField) {
      // Read current stats and increment
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("stats")
        .eq("id", parsed.campaign_id)
        .single();

      if (campaign) {
        const stats = campaign.stats as Record<string, number>;
        stats[statsField] = (stats[statsField] ?? 0) + 1;
        await supabase
          .from("campaigns")
          .update({ stats: stats as unknown as Json })
          .eq("id", parsed.campaign_id);
      }
    }
  });
}
