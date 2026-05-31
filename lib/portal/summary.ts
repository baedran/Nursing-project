import type { SupabaseClient } from "@supabase/supabase-js";
import type { VisitSummaryData } from "@/components/portal/VisitSummaryDocument";
import { formatBeirut as fmt } from "@/lib/portal/datetime";

// Raw shape the pure mapper consumes (already-joined + flattened).
export type SummaryRow = {
  status: string;
  vitals: Record<string, string> | null;
  done_body: string | null;
  observations_body: string | null;
  meds_administered: string[] | null;
  watch_items: string[] | null;
  next_visit_body: string | null;
  coordinator_note: string | null;
  written_at: string | null;
  published_at: string | null;
  patientLabel: string;
  district: string | null;
  caseRef: string;
  visitScheduledAt: string | null;
};

export type SummaryPhoto = { caption: string; url: string };

// Vitals render in this fixed order with these display labels.
const VITAL_FIELDS: { key: string; label: string }[] = [
  { key: "bp", label: "BP" },
  { key: "hr", label: "HR" },
  { key: "spo2", label: "SpO₂" },
  { key: "temp", label: "Temp" },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  published: "Published",
};
/** Pure, synchronous, network-free mapping. Unit-tested. */
export function toSummaryData(row: SummaryRow, photos: SummaryPhoto[]): VisitSummaryData {
  const vitals = VITAL_FIELDS
    .map((f) => ({ label: f.label, value: (row.vitals?.[f.key] ?? "").trim() }))
    .filter((v) => v.value.length > 0);

  return {
    patientLabel: row.patientLabel,
    district: row.district ?? "—",
    visitDateLabel: fmt(row.visitScheduledAt),
    caseRef: row.caseRef,
    liveLabel: STATUS_LABEL[row.status] ?? row.status,
    printLabel: "Print summary",
    vitalsHeading: "Vitals",
    vitals,
    vitalsFootnote: "",
    doneHeading: "What was done",
    doneBody: row.done_body ?? "",
    observationsHeading: "Observations",
    observationsBody: row.observations_body ?? "",
    medsHeading: "Medications administered",
    meds: (row.meds_administered ?? []).filter((m) => m.trim().length > 0),
    watchHeading: "What to watch for, until next visit",
    watchItems: (row.watch_items ?? []).filter((w) => w.trim().length > 0),
    photosHeading: "Photos · wound site",
    photosNote: "Private to your family · signed links",
    photos,
    nextVisitHeading: "Next visit",
    nextVisitBody: row.next_visit_body ?? "",
    coordinatorNoteLabel: "From the coordinator",
    coordinatorNoteBody: row.coordinator_note ?? "",
    footerLine: `Written by your case team · ${fmt(row.published_at ?? row.written_at)} Beirut time`,
  };
}

/**
 * Fetch a summary (+ its joins + signed photo URLs) and map it. The caller is
 * responsible for having authorised the viewer (RLS also enforces it). Photo
 * URLs are signed for 1 hour.
 */
export async function loadSummaryData(
  supabase: SupabaseClient,
  summaryId: string,
): Promise<{ data: VisitSummaryData; visitId: string } | null> {
  const { data: s } = await supabase
    .from("visit_summaries")
    .select(
      "id, visit_id, status, vitals, done_body, observations_body, meds_administered, watch_items, next_visit_body, coordinator_note, written_at, published_at, visits(scheduled_at, cases(case_ref, patients(display_label, district)))",
    )
    .eq("id", summaryId)
    .single();
  if (!s) return null;

  const v: any = s;
  const row: SummaryRow = {
    status: v.status,
    vitals: v.vitals ?? {},
    done_body: v.done_body,
    observations_body: v.observations_body,
    meds_administered: v.meds_administered,
    watch_items: v.watch_items,
    next_visit_body: v.next_visit_body,
    coordinator_note: v.coordinator_note,
    written_at: v.written_at,
    published_at: v.published_at,
    patientLabel: v.visits?.cases?.patients?.display_label ?? "—",
    district: v.visits?.cases?.patients?.district ?? null,
    caseRef: v.visits?.cases?.case_ref ?? "—",
    visitScheduledAt: v.visits?.scheduled_at ?? null,
  };

  const { data: photoRows } = await supabase
    .from("wound_photos")
    .select("storage_path, caption")
    .eq("visit_summary_id", summaryId);

  const photos: SummaryPhoto[] = [];
  for (const p of photoRows ?? []) {
    const { data: signed } = await supabase.storage
      .from("wound-photos")
      .createSignedUrl((p as any).storage_path, 3600);
    if (signed?.signedUrl) {
      photos.push({ caption: (p as any).caption ?? "", url: signed.signedUrl });
    }
  }

  return { data: toSummaryData(row, photos), visitId: v.visit_id };
}
