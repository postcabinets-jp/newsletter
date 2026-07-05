import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Resolves the authenticated user's publication.
 * Most server actions need this: auth check + publication context.
 */
export async function getPublication() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, publication: null } as const;
  }

  const { data: org } = (await supabase
    .from("organizations")
    .select("id, publications(id)")
    .eq("owner_id", user.id)
    .limit(1)
    .single()) as {
    data: { id: string; publications: { id: string }[] } | null;
    error: unknown;
  };

  const publication = (org?.publications as { id: string }[] | undefined)?.[0] ?? null;

  return { supabase, user, publication } as const;
}

/**
 * Guard that throws a typed ActionResult error when auth or publication is missing.
 */
export async function requirePublication() {
  const result = await getPublication();
  if (!result.user) {
    throw new ActionError("認証が必要です");
  }
  if (!result.publication) {
    throw new ActionError("パブリケーションが見つかりません");
  }
  return {
    supabase: result.supabase,
    user: result.user,
    publicationId: result.publication.id,
  };
}

export class ActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActionError";
  }
}

/**
 * Wraps an async action function, catching ActionError and returning ActionResult.
 */
export async function wrapAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (e) {
    if (e instanceof ActionError) {
      return { success: false, error: e.message };
    }
    console.error("[action error]", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "予期しないエラーが発生しました",
    };
  }
}
