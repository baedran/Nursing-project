"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
