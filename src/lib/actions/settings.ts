"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  requirePublication,
  wrapAction,
  ActionError,
  type ActionResult,
} from "./helpers";

// ── Schemas ──

const CreatePublicationSchema = z.object({
  org_name: z.string().min(1, "組織名を入力してください"),
  name: z.string().min(1, "パブリケーション名を入力してください"),
  slug: z.string().min(1, "スラッグを入力してください")
    .regex(/^[a-z0-9-]+$/, "スラッグは小文字英数字とハイフンのみ使用できます"),
  description: z.string().optional(),
});

const UpdatePublicationSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
});

// ── Actions ──

export async function createPublication(
  formData: FormData
): Promise<ActionResult<{ publicationId: string }>> {
  return wrapAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new ActionError("認証が必要です");

    const parsed = CreatePublicationSchema.parse({
      org_name: formData.get("org_name"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description") || undefined,
    });

    // Check if org already exists
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    let orgId: string;

    if (existingOrg) {
      orgId = existingOrg.id;
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          owner_id: user.id,
          name: parsed.org_name.trim(),
          slug: parsed.slug,
        })
        .select("id")
        .single();

      if (orgError) throw new ActionError(orgError.message);
      orgId = newOrg.id;
    }

    const { data: pub, error: pubError } = await supabase
      .from("publications")
      .insert({
        organization_id: orgId,
        name: parsed.name.trim(),
        slug: parsed.slug,
        description: parsed.description?.trim() || null,
      })
      .select("id")
      .single();

    if (pubError) {
      if (pubError.code === "23505") {
        throw new ActionError("このスラッグは既に使用されています");
      }
      throw new ActionError(pubError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { publicationId: pub.id };
  });
}

export async function updatePublication(
  formData: FormData
): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, publicationId } = await requirePublication();

    const parsed = UpdatePublicationSchema.parse({
      name: formData.get("name") || undefined,
      slug: formData.get("slug") || undefined,
      description: formData.get("description") || undefined,
    });

    type PubUpdate = Database["public"]["Tables"]["publications"]["Update"];
    const payload: PubUpdate = {};
    if (parsed.name) payload.name = parsed.name.trim();
    if (parsed.slug) payload.slug = parsed.slug;
    if (parsed.description !== undefined) payload.description = parsed.description.trim() || null;

    if (Object.keys(payload).length === 0) {
      throw new ActionError("更新するフィールドがありません");
    }

    const { error } = await supabase
      .from("publications")
      .update(payload)
      .eq("id", publicationId);

    if (error) {
      if (error.code === "23505") {
        throw new ActionError("このスラッグは既に使用されています");
      }
      throw new ActionError(error.message);
    }

    revalidatePath("/settings");
    revalidatePath("/dashboard");
  });
}
