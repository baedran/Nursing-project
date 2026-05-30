"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ScheduleResult =
  | { ok: true; patientLabel: string; nurseName: string; when: string }
  | { ok: false; error: "forbidden" | "generic" };

/**
 * Coordinator-only. Inserts a scheduled visit assigned to a nurse. Runs through
 * the RLS-bound client; the coordinator-all policy authorises the insert.
 */
export async function scheduleVisit(formData: FormData): Promise<ScheduleResult> {
  const locale = String(formData.get("locale") ?? "en");
  const caseId = String(formData.get("caseId") ?? "");
  const nurseId = String(formData.get("nurseId") ?? "");
  const scheduledAt = String(formData.get("scheduledAt") ?? "");
  const patientLabel = String(formData.get("patientLabel") ?? "");
  const nurseName = String(formData.get("nurseName") ?? "");

  if (!caseId || !nurseId || !scheduledAt) return { ok: false, error: "generic" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "forbidden" };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "coordinator") return { ok: false, error: "forbidden" };

  const when = new Date(scheduledAt);
  if (Number.isNaN(when.getTime())) return { ok: false, error: "generic" };

  const { error } = await supabase.from("visits").insert({
    case_id: caseId,
    assigned_nurse_id: nurseId,
    scheduled_at: when.toISOString(),
    status: "scheduled",
  });
  if (error) return { ok: false, error: "generic" };

  revalidatePath(`/${locale}/portal`);
  return { ok: true, patientLabel, nurseName, when: when.toLocaleString() };
}
