"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";
import {
  requirePublication,
  wrapAction,
  ActionError,
  type ActionResult,
} from "./helpers";

// ── Schemas ──

const AddSubscriberSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  source: z.string().optional(),
});

const UpdateSubscriberSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  status: z.enum(["active", "unsubscribed", "bounced", "complained", "pending"]).optional(),
  source: z.string().optional(),
});

const DeleteSubscriberSchema = z.object({
  id: z.string().uuid(),
});

const UnsubscribeSchema = z.object({
  id: z.string().uuid(),
});

const ImportCsvRowSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  source: z.string().optional(),
});

// ── Actions ──

export async function addSubscriber(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();
    const parsed = AddSubscriberSchema.parse({
      email: formData.get("email"),
      first_name: formData.get("first_name") || undefined,
      last_name: formData.get("last_name") || undefined,
      source: formData.get("source") || undefined,
    });

    const { data, error } = await supabase
      .from("subscribers")
      .insert({
        publication_id: publicationId,
        email: parsed.email.toLowerCase().trim(),
        first_name: parsed.first_name?.trim() || null,
        last_name: parsed.last_name?.trim() || null,
        source: parsed.source?.trim() || "manual",
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ActionError("このメールアドレスは既に登録されています");
      }
      throw new ActionError(error.message);
    }

    revalidatePath("/subscribers");
    return { id: data.id };
  });
}

export async function updateSubscriber(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const parsed = UpdateSubscriberSchema.parse({
      id: formData.get("id"),
      email: formData.get("email") || undefined,
      first_name: formData.get("first_name") || undefined,
      last_name: formData.get("last_name") || undefined,
      status: formData.get("status") || undefined,
      source: formData.get("source") || undefined,
    });

    const { id, ...updates } = parsed;

    type SubUpdate = Database["public"]["Tables"]["subscribers"]["Update"];
    const updatePayload: SubUpdate = {};
    if (updates.email) updatePayload.email = updates.email.toLowerCase().trim();
    if (updates.first_name !== undefined) updatePayload.first_name = updates.first_name.trim() || null;
    if (updates.last_name !== undefined) updatePayload.last_name = updates.last_name.trim() || null;
    if (updates.status) {
      updatePayload.status = updates.status;
      if (updates.status === "unsubscribed") {
        updatePayload.unsubscribed_at = new Date().toISOString();
      }
    }
    if (updates.source !== undefined) updatePayload.source = updates.source.trim() || null;

    if (Object.keys(updatePayload).length === 0) {
      throw new ActionError("更新するフィールドがありません");
    }

    const { error } = await supabase
      .from("subscribers")
      .update(updatePayload)
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/subscribers");
  });
}

export async function deleteSubscriber(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { id } = DeleteSubscriberSchema.parse({
      id: formData.get("id"),
    });

    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/subscribers");
  });
}

export async function unsubscribe(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { id } = UnsubscribeSchema.parse({
      id: formData.get("id"),
    });

    const { error } = await supabase
      .from("subscribers")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/subscribers");
  });
}

/**
 * Import subscribers from CSV text.
 * Expects header row: email,first_name,last_name,source
 * Returns count of imported/skipped.
 */
export async function importSubscribersCsv(
  formData: FormData
): Promise<ActionResult<{ imported: number; skipped: number; errors: string[] }>> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();
    const csvText = formData.get("csv") as string | null;

    if (!csvText?.trim()) {
      throw new ActionError("CSVデータが空です");
    }

    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new ActionError("ヘッダー行とデータ行が必要です");
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIdx = header.indexOf("email");
    if (emailIdx === -1) {
      throw new ActionError("CSVに'email'列が見つかりません");
    }
    const firstNameIdx = header.indexOf("first_name");
    const lastNameIdx = header.indexOf("last_name");
    const sourceIdx = header.indexOf("source");

    const rows: z.infer<typeof ImportCsvRowSchema>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (!cols[emailIdx]) continue;

      const result = ImportCsvRowSchema.safeParse({
        email: cols[emailIdx],
        first_name: firstNameIdx >= 0 ? cols[firstNameIdx] || undefined : undefined,
        last_name: lastNameIdx >= 0 ? cols[lastNameIdx] || undefined : undefined,
        source: sourceIdx >= 0 ? cols[sourceIdx] || undefined : undefined,
      });

      if (result.success) {
        rows.push(result.data);
      } else {
        errors.push(`行 ${i + 1}: ${result.error.issues[0]?.message ?? "不正なデータ"}`);
      }
    }

    if (rows.length === 0) {
      throw new ActionError("インポートできる行がありません");
    }

    // Batch upsert (skip duplicates)
    const insertPayload = rows.map((row) => ({
      publication_id: publicationId,
      email: row.email.toLowerCase().trim(),
      first_name: row.first_name?.trim() || null,
      last_name: row.last_name?.trim() || null,
      source: row.source?.trim() || "csv_import",
      status: "active" as const,
    }));

    const { data, error } = await supabase
      .from("subscribers")
      .upsert(insertPayload, {
        onConflict: "publication_id,email",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) throw new ActionError(error.message);

    const imported = data?.length ?? 0;
    const skipped = rows.length - imported;

    revalidatePath("/subscribers");
    return { imported, skipped, errors };
  });
}

export async function exportSubscribersCsv(): Promise<ActionResult<string>> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { data: subscribers, error } = await supabase
      .from("subscribers")
      .select("email, first_name, last_name, status, source, subscribed_at")
      .eq("publication_id", publicationId)
      .order("subscribed_at", { ascending: false });

    if (error) throw new ActionError(error.message);

    const header = "email,first_name,last_name,status,source,subscribed_at";
    const rows = (subscribers ?? []).map((s) =>
      [
        s.email,
        s.first_name ?? "",
        s.last_name ?? "",
        s.status,
        s.source ?? "",
        s.subscribed_at,
      ].join(",")
    );

    return [header, ...rows].join("\n");
  });
}
