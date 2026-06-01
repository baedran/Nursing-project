"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateToken, shareExpiry } from "@/lib/portal/share";

export type ReviewResult = { ok: boolean };

async function coordClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorised");
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "coordinator") throw new Error("forbidden");
  return supabase;
}

export async function saveCoordinatorNote(summaryId: string, note: string): Promise<ReviewResult> {
  const supabase = await coordClient();
  const { error } = await supabase
    .from("visit_summaries")
    .update({ coordinator_note: note })
    .eq("id", summaryId);
  return { ok: !error };
}

export async function publish(summaryId: string): Promise<ReviewResult> {
  const supabase = await coordClient();
  const { error } = await supabase.rpc("publish_summary", { target_summary_id: summaryId });
  if (!error) revalidatePath("/portal");
  return { ok: !error };
}

export async function sendBack(summaryId: string, reason: string): Promise<ReviewResult> {
  const supabase = await coordClient();
  const { error } = await supabase.rpc("send_back_summary", {
    target_summary_id: summaryId,
    send_back_reason: reason,
  });
  if (!error) revalidatePath("/portal");
  return { ok: !error };
}

async function requireCoordinator(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorised" };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "coordinator") return { ok: false, error: "forbidden" };
  return { ok: true, supabase, userId: user.id };
}

export type ShareLinkResult =
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string };

/**
 * Coordinator-only. Returns a share token for a PUBLISHED summary, reusing a
 * still-valid existing link if one exists (so reopening the page doesn't pile
 * up tokens), otherwise creating a fresh 30-day link.
 */
export async function createShareLink(summaryId: string): Promise<ShareLinkResult> {
  const auth = await requireCoordinator();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: summary } = await (auth.supabase as any)
    .from("visit_summaries")
    .select("status")
    .eq("id", summaryId)
    .single();
  if (!summary || summary.status !== "published") {
    return { ok: false, error: "Only published summaries can be shared." };
  }

  const { data: existing } = await (auth.supabase as any)
    .from("summary_share_links")
    .select("token, expires_at")
    .eq("visit_summary_id", summaryId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: true, token: existing.token, expiresAt: existing.expires_at };
  }

  const token = generateToken();
  const expiresAt = shareExpiry().toISOString();
  const { error } = await (auth.supabase as any)
    .from("summary_share_links")
    .insert({
      token,
      visit_summary_id: summaryId,
      expires_at: expiresAt,
      created_by: auth.userId,
    });
  if (error) return { ok: false, error: error.message };

  return { ok: true, token, expiresAt };
}
