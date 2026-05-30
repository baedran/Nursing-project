"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveResult = { ok: boolean };

type SummaryFields = {
  summaryId: string;
  vitals: { bp: string; hr: string; spo2: string; temp: string };
  doneBody: string;
  observationsBody: string;
  meds: string[];
  watchItems: string[];
  nextVisitBody: string;
};

async function assertNurseForSummary(_summaryId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("unauthorised");
  return supabase;
}

export async function saveDraft(fields: SummaryFields): Promise<SaveResult> {
  const supabase = await assertNurseForSummary(fields.summaryId);
  const { error } = await supabase
    .from("visit_summaries")
    .update({
      vitals: fields.vitals,
      done_body: fields.doneBody,
      observations_body: fields.observationsBody,
      meds_administered: fields.meds.filter((m) => m.trim()),
      watch_items: fields.watchItems.filter((w) => w.trim()),
      next_visit_body: fields.nextVisitBody,
    })
    .eq("id", fields.summaryId);
  return { ok: !error };
}

export async function submitForReview(fields: SummaryFields): Promise<SaveResult> {
  const supabase = await assertNurseForSummary(fields.summaryId);
  const save = await supabase
    .from("visit_summaries")
    .update({
      vitals: fields.vitals,
      done_body: fields.doneBody,
      observations_body: fields.observationsBody,
      meds_administered: fields.meds.filter((m) => m.trim()),
      watch_items: fields.watchItems.filter((w) => w.trim()),
      next_visit_body: fields.nextVisitBody,
    })
    .eq("id", fields.summaryId);
  if (save.error) return { ok: false };
  const { error } = await supabase.rpc("submit_summary", { target_summary_id: fields.summaryId });
  if (!error) revalidatePath("/portal");
  return { ok: !error };
}
