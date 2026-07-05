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

const CreateTagSchema = z.object({
  name: z.string().min(1, "タグ名を入力してください").max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "有効なカラーコードを入力してください").optional(),
});

const UpdateTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const DeleteTagSchema = z.object({
  id: z.string().uuid(),
});

const AssignTagSchema = z.object({
  subscriber_id: z.string().uuid(),
  tag_id: z.string().uuid(),
});

const BulkAssignTagSchema = z.object({
  subscriber_ids: z.string().transform((s) => {
    const ids = s.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) throw new Error("subscriber_ids が空です");
    ids.forEach((id) => {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error(`不正なUUID: ${id}`);
      }
    });
    return ids;
  }),
  tag_id: z.string().uuid(),
});

// ── Actions ──

export async function createTag(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const parsed = CreateTagSchema.parse({
      name: formData.get("name"),
      color: formData.get("color") || undefined,
    });

    const { data, error } = await supabase
      .from("tags")
      .insert({
        publication_id: publicationId,
        name: parsed.name.trim(),
        color: parsed.color ?? "#6366f1",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new ActionError("同じ名前のタグが既に存在します");
      }
      throw new ActionError(error.message);
    }

    revalidatePath("/subscribers");
    return { id: data.id };
  });
}

export async function updateTag(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const parsed = UpdateTagSchema.parse({
      id: formData.get("id"),
      name: formData.get("name") || undefined,
      color: formData.get("color") || undefined,
    });

    const { id, ...updates } = parsed;

    type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];
    const payload: TagUpdate = {};
    if (updates.name) payload.name = updates.name.trim();
    if (updates.color) payload.color = updates.color;

    if (Object.keys(payload).length === 0) {
      throw new ActionError("更新するフィールドがありません");
    }

    const { error } = await supabase
      .from("tags")
      .update(payload)
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) {
      if (error.code === "23505") {
        throw new ActionError("同じ名前のタグが既に存在します");
      }
      throw new ActionError(error.message);
    }

    revalidatePath("/subscribers");
  });
}

export async function deleteTag(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { id } = DeleteTagSchema.parse({ id: formData.get("id") });

    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("publication_id", publicationId);

    if (error) throw new ActionError(error.message);
    revalidatePath("/subscribers");
  });
}

export async function assignTag(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase } = await requirePublication();

    const parsed = AssignTagSchema.parse({
      subscriber_id: formData.get("subscriber_id"),
      tag_id: formData.get("tag_id"),
    });

    const { error } = await supabase
      .from("subscriber_tags")
      .insert({
        subscriber_id: parsed.subscriber_id,
        tag_id: parsed.tag_id,
      });

    if (error) {
      if (error.code === "23505") {
        // Already assigned — not an error
        return;
      }
      throw new ActionError(error.message);
    }

    revalidatePath("/subscribers");
  });
}

export async function removeTag(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase } = await requirePublication();

    const parsed = AssignTagSchema.parse({
      subscriber_id: formData.get("subscriber_id"),
      tag_id: formData.get("tag_id"),
    });

    const { error } = await supabase
      .from("subscriber_tags")
      .delete()
      .eq("subscriber_id", parsed.subscriber_id)
      .eq("tag_id", parsed.tag_id);

    if (error) throw new ActionError(error.message);
    revalidatePath("/subscribers");
  });
}

export async function bulkAssignTag(
  formData: FormData
): Promise<ActionResult<{ assigned: number }>> {
  return wrapAction(async () => {
    const { supabase } = await requirePublication();

    const parsed = BulkAssignTagSchema.parse({
      subscriber_ids: formData.get("subscriber_ids"),
      tag_id: formData.get("tag_id"),
    });

    const rows = parsed.subscriber_ids.map((subscriberId) => ({
      subscriber_id: subscriberId,
      tag_id: parsed.tag_id,
    }));

    const { data, error } = await supabase
      .from("subscriber_tags")
      .upsert(rows, {
        onConflict: "subscriber_id,tag_id",
        ignoreDuplicates: true,
      })
      .select("subscriber_id");

    if (error) throw new ActionError(error.message);
    revalidatePath("/subscribers");
    return { assigned: data?.length ?? 0 };
  });
}

export async function listTags(): Promise<ActionResult<{ id: string; name: string; color: string }[]>> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const { data, error } = await supabase
      .from("tags")
      .select("id, name, color")
      .eq("publication_id", publicationId)
      .order("name");

    if (error) throw new ActionError(error.message);
    return data ?? [];
  });
}
