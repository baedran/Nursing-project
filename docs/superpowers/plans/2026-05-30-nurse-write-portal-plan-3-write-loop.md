# Nurse-Write Portal — Plan 3: The Write Loop + Wound Photos

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Checkbox steps.

**Goal:** Complete the loop — a nurse sees her assigned visits, writes a structured summary (with wound photos), submits it; the coordinator reviews it in the real family-document layout and publishes or sends it back; published summaries are locked and visible to the family.

**Architecture:** A shared mapper `lib/portal/summary.ts` turns DB rows (+ signed photo URLs) into the `VisitSummaryData` shape the existing `VisitSummaryDocument` already renders — reused for the writer Preview, the coordinator Review, and (later) the family read. State transitions call the Plan 1 `SECURITY DEFINER` RPCs (`submit_summary`, `open_review`, `publish_summary`, `send_back_summary`); nothing edits status directly. Wound photos upload to the private `wound-photos` bucket from the authenticated browser client; display uses short-lived signed URLs generated server-side.

**Tech Stack:** Next.js 16 · React 19 · TS · Tailwind v4 · Supabase (server/admin/browser clients + storage) · Vitest.

**Spec:** `2026-05-30-nurse-write-portal-design.md` §3 (lifecycle), §4.4–4.6, §5 (photos). Plans 1+2 are committed.

---

## Background the engineer needs

- Solo founder, nurse, minimal coding background. Small, readable code. Reuse the existing design idiom (see Plan 2 components: `CoordinatorHome.tsx`, `AddNurseForm.tsx`, `ScheduleVisitForm.tsx`, and `VisitSummaryDocument.tsx`).
- **Seed data already in the cloud DB** (from the Plan 2 smoke test): nurse **Rita K.** (`smoke_nurse@cc-smoke.test`, role nurse, active) and a **scheduled visit** for patient **Mariam**, Case 2026-051, on 2026-06-05 18:30. Use these to test.
- **`VisitSummaryData`** is exported from `components/portal/VisitSummaryDocument.tsx`. Fields: `patientLabel, district, visitDateLabel, caseRef, liveLabel, printLabel, vitalsHeading, vitals:{label,value}[], vitalsFootnote, doneHeading, doneBody, observationsHeading, observationsBody, medsHeading, meds:string[], watchHeading, watchItems:string[], photosHeading, photosNote, photos:{caption,url}[], nextVisitHeading, nextVisitBody, coordinatorNoteLabel, coordinatorNoteBody, footerLine`.
- **`visit_summaries` columns:** `id, visit_id, vitals (jsonb {bp,hr,spo2,temp}), done_body, observations_body, meds_administered (text[]), watch_items (text[]), next_visit_body, coordinator_note, written_at, finalised, status, sent_back_reason, submitted_at, published_at`.
- **RPCs (Plan 1):** `submit_summary(target_summary_id)`, `open_review(target_summary_id)`, `publish_summary(target_summary_id)`, `send_back_summary(target_summary_id, send_back_reason)`. Call via `supabase.rpc("submit_summary", { target_summary_id })`. Returns `{ error }` on failure.
- **RLS already allows:** assigned nurse to insert/update a summary while status in (draft, changes_requested); coordinator all; assigned nurse + coordinator to manage `wound_photos`; family read only when published.
- **Clients:** `@/lib/supabase/server` (RLS, server), `@/lib/supabase/admin` (service-role, server-only), `@/lib/supabase/client` (browser, RLS via session). Browser client is needed for photo upload from the writer form.
- **Storage:** bucket `wound-photos` (private). Upload path convention from the storage policy: `families/{family_id}/...`. Use `families/{family_id}/visit-{visitId}/{uuid}.{ext}`.
- **DB helper:** `node scripts/db-query.mjs -e "<sql>"`. **Cookie mint for browser smoke:** `node scripts/mint-session-cookies.mjs <email>` prints session cookie JSON.
- **Tailwind v4 gotcha:** dark-button text uses inline CSS vars `style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}`.

Run from project root. `npm test` (unit), `npm run test:rls` (integration), `npm run build`.

---

## File map

| Path | C/M | Responsibility |
|------|-----|----------------|
| `lib/portal/summary.ts` | Create | DB rows → `VisitSummaryData`; signed photo URLs; field constants |
| `lib/portal/summary.test.ts` | Create | Unit tests for the pure mapping (no network) |
| `messages/en.json` / `ar.json` | Modify | Add `portal.writer.*`, `portal.review.*`, `portal.nurseDash.*` |
| `components/portal/NurseDashboard.tsx` | Create | Action-first dashboard (replaces NurseHome usage) |
| `app/[locale]/portal/page.tsx` | Modify | Nurse branch loads visits → renders NurseDashboard |
| `app/[locale]/portal/visits/[visitId]/summary/page.tsx` | Create | Find-or-create draft; render writer |
| `app/[locale]/portal/visits/[visitId]/summary/actions.ts` | Create | saveDraft, submitForReview |
| `components/portal/SummaryForm.tsx` | Create | Client writer: fields, repeatable lists, preview, photo upload |
| `components/portal/WoundPhotoUploader.tsx` | Create | Client upload to bucket + caption + list |
| `app/[locale]/portal/review/[summaryId]/page.tsx` | Create | open_review on load; render document + review controls |
| `app/[locale]/portal/review/[summaryId]/actions.ts` | Create | saveCoordinatorNote, publish, sendBack |
| `components/portal/ReviewControls.tsx` | Create | Client: coord-note textarea, Publish, Send-back+reason |
| `tests/rls/write-loop.itest.ts` | Create | Full lifecycle via RPCs + photo RLS |

---

## Task 1: The summary mapper + i18n

**Files:** `lib/portal/summary.ts`, `lib/portal/summary.test.ts`, `messages/en.json`, `messages/ar.json`.

The mapper has TWO entry points: a pure synchronous `toSummaryData(input)` (no network — unit tested), and an async `loadSummaryData(supabase, summaryId)` that fetches rows + signs photo URLs and calls the pure one.

- [ ] **Step 1: Unit test (pure mapping)** — `lib/portal/summary.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { toSummaryData, type SummaryRow } from "@/lib/portal/summary";

const base: SummaryRow = {
  status: "published",
  vitals: { bp: "128/82", hr: "74", spo2: "97", temp: "36.6" },
  done_body: "IV hydration.",
  observations_body: "Alert and comfortable.",
  meds_administered: ["Vancomycin 1 g IV"],
  watch_items: ["Fever above 38°C"],
  next_visit_body: "Thu 18:30.",
  coordinator_note: "Supplies on hand.",
  written_at: "2026-05-14T16:12:00Z",
  published_at: "2026-05-14T17:00:00Z",
  patientLabel: "Mariam",
  district: "Achrafieh",
  caseRef: "Case 2026-051",
  visitScheduledAt: "2026-05-14T15:30:00Z",
};

describe("toSummaryData", () => {
  test("maps vitals object into ordered label/value pairs", () => {
    const d = toSummaryData(base, []);
    expect(d.vitals).toEqual([
      { label: "BP", value: "128/82" },
      { label: "HR", value: "74" },
      { label: "SpO₂", value: "97" },
      { label: "Temp", value: "36.6" },
    ]);
  });

  test("passes through bodies and lists", () => {
    const d = toSummaryData(base, []);
    expect(d.doneBody).toBe("IV hydration.");
    expect(d.meds).toEqual(["Vancomycin 1 g IV"]);
    expect(d.watchItems).toEqual(["Fever above 38°C"]);
    expect(d.caseRef).toBe("Case 2026-051");
  });

  test("omits vitals with empty values", () => {
    const d = toSummaryData({ ...base, vitals: { bp: "120/80", hr: "", spo2: "", temp: "37" } }, []);
    expect(d.vitals.map((v) => v.label)).toEqual(["BP", "Temp"]);
  });

  test("maps photos with their signed urls", () => {
    const d = toSummaryData(base, [{ caption: "Pre-dressing", url: "https://signed/1" }]);
    expect(d.photos).toEqual([{ caption: "Pre-dressing", url: "https://signed/1" }]);
  });

  test("status drives the live label", () => {
    expect(toSummaryData({ ...base, status: "published" }, []).liveLabel).toBe("Published");
    expect(toSummaryData({ ...base, status: "draft" }, []).liveLabel).toBe("Draft");
    expect(toSummaryData({ ...base, status: "in_review" }, []).liveLabel).toBe("In review");
  });
});
```

- [ ] **Step 2: Run, confirm fail** — `npm test -- summary` → FAIL (module missing).

- [ ] **Step 3: Implement `lib/portal/summary.ts`:**

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VisitSummaryData } from "@/components/portal/VisitSummaryDocument";

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

function fmt(ts: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

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
```

- [ ] **Step 4: Run, confirm pass** — `npm test -- summary` → PASS (5 tests).

- [ ] **Step 5: i18n** — add to `messages/en.json` `portal` object (and mirror in `ar.json` with same values):

```json
    "nurseDash": {
      "eyebrow": "Nurse",
      "headline": "Welcome back, {name}.",
      "needsLabel": "Needs your write-up",
      "sentBackLabel": "Sent back to fix",
      "historyLabel": "Submitted & published",
      "writeCta": "Write summary",
      "editCta": "Edit",
      "viewCta": "View",
      "empty": "No visits assigned yet. When the coordinator schedules one for you, it shows up here.",
      "visitedPrefix": "Visit",
      "statusWith": "With coordinator",
      "statusPublished": "Published",
      "statusInReview": "In review",
      "statusSubmitted": "Submitted"
    },
    "writer": {
      "eyebrow": "Write visit summary",
      "back": "Back to your visits",
      "sentBackTitle": "Sent back for changes",
      "vitals": "Vitals",
      "bp": "Blood pressure",
      "hr": "Heart rate (bpm)",
      "spo2": "SpO₂ (%)",
      "temp": "Temp (°C)",
      "done": "What was done",
      "observations": "Observations",
      "meds": "Medications given",
      "addMed": "+ add medication",
      "watch": "What to watch for",
      "addWatch": "+ add item",
      "nextVisit": "Next visit",
      "photos": "Wound photos",
      "addPhoto": "Add photo",
      "photoCaption": "Caption (optional)",
      "uploading": "Uploading…",
      "remove": "Remove",
      "preview": "Preview",
      "hidePreview": "Hide preview",
      "saveDraft": "Save draft",
      "saved": "Draft saved",
      "submit": "Submit for review",
      "submitted": "Submitted for review",
      "submittedBody": "The coordinator has it now. You'll see it back here if changes are needed.",
      "errorSave": "Could not save. Try again.",
      "errorSubmit": "Could not submit. Make sure you've saved, then try again."
    },
    "review": {
      "eyebrow": "Review",
      "back": "Back to coordinator desk",
      "coordNote": "Coordinator note (added to the summary)",
      "saveNote": "Save note",
      "noteSaved": "Note saved",
      "publish": "Publish to family",
      "published": "Published",
      "publishedBody": "The family can now see this summary.",
      "sendBack": "Send back to nurse",
      "sendBackReason": "What needs fixing?",
      "sendBackConfirm": "Send back",
      "sentBack": "Sent back",
      "sentBackBody": "The nurse will see your note and can resubmit.",
      "errorGeneric": "Something went wrong. Try again."
    }
```

- [ ] **Step 6: Commit** — `git add lib/portal/summary.ts lib/portal/summary.test.ts messages/en.json messages/ar.json && git commit -m "feat(portal): visit-summary mapper + writer/review i18n"`

---

## Task 2: Nurse dashboard (action-first)

**Files:** `components/portal/NurseDashboard.tsx`, modify `app/[locale]/portal/page.tsx`.

- [ ] **Step 1: Create `components/portal/NurseDashboard.tsx`** (server component). Props:

```tsx
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type Item = {
  visitId: string;
  summaryId: string | null;
  patientLabel: string;
  caseRef: string;
  scheduledLabel: string;
  status: string | null; // null = no summary yet
  sentBackReason: string | null;
};

export default function NurseDashboard({
  locale, dict, displayName, needs, sentBack, history,
}: {
  locale: string; dict: Dictionary; displayName: string;
  needs: Item[]; sentBack: Item[]; history: Item[];
}) {
  const t = dict.portal.nurseDash;
  // eyebrow t.eyebrow; headline t.headline.replace("{name}", displayName)
  // Section "Needs your write-up" (t.needsLabel): each item -> card with
  //   patientLabel (font-display) + mono `caseRef · {visitedPrefix} scheduledLabel`
  //   + a dark pill Link to `/${locale}/portal/visits/${visitId}/summary` labelled t.writeCta.
  //   Use a peach left-accent (border-l-2 border-peach) to signal "to do".
  // Section "Sent back to fix" (t.sentBackLabel) only if sentBack.length: each card
  //   shows the sentBackReason in a small peach note + Edit pill (same link, t.editCta).
  // Section "Submitted & published" (t.historyLabel), muted: each item shows a status
  //   pill (map status: submitted->t.statusSubmitted, in_review->t.statusInReview/With coordinator,
  //   published->t.statusPublished) and, when published & summaryId, a View link to the summary route.
  // If needs+sentBack+history all empty -> dashed empty-state card with t.empty.
}
```
Match the visual idiom from `CoordinatorHome.tsx` (cards `rounded-xl border border-rule bg-white px-5 py-4`, eyebrow class, dashed empty-state). Inner content only (page provides the shell).

- [ ] **Step 2: Wire the nurse branch in `app/[locale]/portal/page.tsx`.** Replace the `if (role === "nurse")` block with data loading + `<NurseDashboard>`:

```tsx
  if (role === "nurse") {
    const { data: nurseRow } = await supabase
      .from("nurses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const nurseId = nurseRow?.id ?? "__none__";
    const { data: visitRows } = await supabase
      .from("visits")
      .select(
        "id, scheduled_at, status, cases(case_ref, patients(display_label)), visit_summaries(id, status, sent_back_reason)",
      )
      .eq("assigned_nurse_id", nurseId)
      .order("scheduled_at", { ascending: false });

    const items = (visitRows ?? []).map((v: any) => {
      const summary = Array.isArray(v.visit_summaries) ? v.visit_summaries[0] : v.visit_summaries;
      return {
        visitId: v.id as string,
        summaryId: summary?.id ?? null,
        patientLabel: v.cases?.patients?.display_label ?? "—",
        caseRef: v.cases?.case_ref ?? "—",
        scheduledLabel: v.scheduled_at ? new Date(v.scheduled_at).toLocaleString() : "—",
        status: summary?.status ?? null,
        sentBackReason: summary?.sent_back_reason ?? null,
      };
    });

    const needs = items.filter((i) => i.status === null || i.status === "draft");
    const sentBack = items.filter((i) => i.status === "changes_requested");
    const history = items.filter((i) => ["submitted", "in_review", "published"].includes(i.status ?? ""));

    return (
      <PortalShell>
        <NurseDashboard
          locale={locale} dict={dict} displayName={displayName}
          needs={needs} sentBack={sentBack} history={history}
        />
      </PortalShell>
    );
  }
```
Add `import NurseDashboard from "@/components/portal/NurseDashboard";` and remove the now-unused `NurseHome` import (delete the component file too, or leave it — prefer removing the import and deleting `components/portal/NurseHome.tsx`).

- [ ] **Step 3: Build + tests** — `npm run build` (clean), `npm test` (all pass).

- [ ] **Step 4: Commit** — `git add ... && git commit -m "feat(portal): action-first nurse dashboard"`

---

## Task 3: The summary writer + wound photo upload

**Files:** writer page + actions + `SummaryForm.tsx` + `WoundPhotoUploader.tsx`.

- [ ] **Step 1: Writer actions** — `app/[locale]/portal/visits/[visitId]/summary/actions.ts`:

```ts
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

async function assertNurseForSummary(summaryId: string) {
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
```

- [ ] **Step 2: Writer page** — `app/[locale]/portal/visits/[visitId]/summary/page.tsx` (server). Logic:
  - await params (`{ locale, visitId }`), isLocale guard, dict, user; if no user return null.
  - Confirm the user is the assigned nurse for this visit and load context:
    ```ts
    const { data: visit } = await supabase
      .from("visits")
      .select("id, scheduled_at, assigned_nurse_id, cases(case_ref, patients(display_label, district, family_id)), nurses!visits_assigned_nurse_id_fkey(user_id)")
      .eq("id", visitId)
      .single();
    ```
    If `!visit` or `visit.nurses?.user_id !== user.id` → `redirect(`/${locale}/portal`)`.
  - **Find-or-create the draft summary** for this visit:
    ```ts
    let { data: summary } = await supabase
      .from("visit_summaries")
      .select("id, status, vitals, done_body, observations_body, meds_administered, watch_items, next_visit_body, sent_back_reason")
      .eq("visit_id", visitId)
      .maybeSingle();
    if (!summary) {
      const { data: created } = await supabase
        .from("visit_summaries")
        .insert({ visit_id: visitId, status: "draft" })
        .select("id, status, vitals, done_body, observations_body, meds_administered, watch_items, next_visit_body, sent_back_reason")
        .single();
      summary = created;
    }
    ```
  - If `summary.status` is `submitted`/`in_review`/`published` (read-only states), render a read-only notice + a link back (nurse can't edit now). Otherwise render `<SummaryForm>` with the summary + visit context + the patient's `family_id` (for photo upload path) + the existing photos.
  - Load existing photos: `supabase.from("wound_photos").select("id, storage_path, caption").eq("visit_summary_id", summary.id)` and sign each for preview (use `loadSummaryData` is overkill; just pass storage_path + caption and let the uploader component show captions; for preview images, generate signed URLs server-side here and pass them in).
  - Pass `dict`, `locale` too.

- [ ] **Step 3: WoundPhotoUploader** — `components/portal/WoundPhotoUploader.tsx` ("use client"). Props: `{ summaryId, visitId, familyId, dict, initialPhotos: {id,caption,url}[] }`. Behavior:
  - Uses the browser client `import { createClient } from "@/lib/supabase/client"`.
  - Renders a list of existing photos (thumbnail via signed `url` + caption + a Remove button) and an "Add photo" file input + optional caption input.
  - On file select + Add: upload to `wound-photos` at `families/${familyId}/visit-${visitId}/${crypto.randomUUID()}.${ext}` via `supabase.storage.from("wound-photos").upload(path, file)`. On success insert a row: `supabase.from("wound_photos").insert({ visit_summary_id: summaryId, storage_path: path, caption })`. Then create a signed URL for immediate display: `supabase.storage.from("wound-photos").createSignedUrl(path, 3600)`. Append to local state. Show `uploading` text while in flight.
  - Remove: delete the `wound_photos` row by id (RLS lets the nurse manage her own) and remove from local state. (Leaving the storage object is acceptable for now; deleting it is optional.)
  - Accept only image/jpeg,png,webp; the bucket enforces 10 MB + mime.

- [ ] **Step 4: SummaryForm** — `components/portal/SummaryForm.tsx` ("use client"). Props: `{ locale, dict, summaryId, visitId, familyId, initial: {...fields...}, sentBackReason, patientLabel, district, caseRef, visitScheduledAt, initialPhotos }`. Behavior:
  - Controlled state for all fields (vitals bp/hr/spo2/temp, doneBody, observationsBody, meds string[], watchItems string[], nextVisitBody).
  - If `sentBackReason`, show a peach banner at top (dict.portal.writer.sentBackTitle + the reason).
  - Repeatable meds/watch lists: each row an input + remove (✕); an "+ add" button appends "".
  - Render `<WoundPhotoUploader>`.
  - Buttons (sticky bar): **Preview** toggles rendering `<VisitSummaryDocument data={toSummaryData(rowFromState, previewPhotos)} />` below (import `toSummaryData` from `@/lib/portal/summary`; build a `SummaryRow` from current state with `status:"draft"`, `patientLabel/district/caseRef/visitScheduledAt` from props, `written_at:null, published_at:null, coordinator_note:null`; previewPhotos = current uploader photos {caption,url}). **Save draft** calls `saveDraft({...})` (show dict.portal.writer.saved transiently). **Submit for review** calls `submitForReview({...})`; on `{ok:true}` show a success panel (dict.portal.writer.submitted/submittedBody) + a link back to `/${locale}/portal`. Use `useTransition` for pending state; show errors with dict.portal.writer.errorSave / errorSubmit.
  - Inputs/labels follow the design idiom (login inputs; mono labels). Vitals in a 4-col grid (`grid grid-cols-2 sm:grid-cols-4 gap-3`).

- [ ] **Step 5: Build** — `npm run build` (route `/[locale]/portal/visits/[visitId]/summary` appears). Fix type errors (`as any` on nested selects OK).

- [ ] **Step 6: Commit** — `git add app/[locale]/portal/visits components/portal/SummaryForm.tsx components/portal/WoundPhotoUploader.tsx && git commit -m "feat(portal): nurse summary writer + wound photo upload"`

---

## Task 4: Coordinator review / publish / send-back

**Files:** review page + actions + `ReviewControls.tsx`.

- [ ] **Step 1: Review actions** — `app/[locale]/portal/review/[summaryId]/actions.ts`:

```ts
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
```

- [ ] **Step 2: Review page** — `app/[locale]/portal/review/[summaryId]/page.tsx` (server, coordinator-only):
  - await params `{ locale, summaryId }`, guards, dict, user; coordinator-role check → else redirect `/portal`.
  - Move a `submitted` summary to `in_review`: `await supabase.rpc("open_review", { target_summary_id: summaryId });` (no-op if not submitted — safe).
  - Load the document via `loadSummaryData(supabase, summaryId)`; if null → notFound().
  - Load current `status` + `coordinator_note` for the controls (`supabase.from("visit_summaries").select("status, coordinator_note").eq("id", summaryId).single()`).
  - Render shell: back link to `/portal`; eyebrow dict.portal.review.eyebrow; the `<VisitSummaryDocument data={doc.data} />`; then `<ReviewControls locale, dict, summaryId, status, initialNote>` — UNLESS status is already `published` (then show a published badge + back link, no controls).

- [ ] **Step 3: ReviewControls** — `components/portal/ReviewControls.tsx` ("use client"). Props `{ locale, dict, summaryId, initialNote }`. Behavior:
  - A coordinator-note `<textarea>` (label dict.portal.review.coordNote) + Save note button (calls `saveCoordinatorNote`; transient dict.portal.review.noteSaved).
  - A **Publish to family** button (calls `publish`; on ok show dict.portal.review.published/publishedBody + back link).
  - A **Send back** flow: a textarea (dict.portal.review.sendBackReason) + a Send-back button (calls `sendBack(summaryId, reason)`, requires non-empty reason; on ok show sentBack/sentBackBody + back link).
  - useTransition for pending; errors → dict.portal.review.errorGeneric.
  - Publish button is the prominent dark/teal pill; Send-back is a ghost/secondary style.

- [ ] **Step 4: Build** — `npm run build` (route `/[locale]/portal/review/[summaryId]` appears).

- [ ] **Step 5: Commit** — `git add app/[locale]/portal/review components/portal/ReviewControls.tsx && git commit -m "feat(portal): coordinator review, publish, and send-back"`

---

## Task 5: Full lifecycle integration test + verification

**Files:** `tests/rls/write-loop.itest.ts`.

- [ ] **Step 1: Integration test** — mirrors the real flow through the RPCs and checks photo RLS. Use `@cc-loop.test` fixtures + teardown (copy the structure from `tests/rls/coordinator-tools.itest.ts`). Assert:
  1. nurse can insert a draft for her assigned visit;
  2. nurse can update draft content;
  3. `submit_summary` moves draft→submitted (nurse);
  4. coordinator `open_review` → in_review;
  5. coordinator `publish_summary` → published; family can now read it;
  6. `send_back_summary` from a second submitted summary → changes_requested with the reason readable by the nurse;
  7. a nurse can insert a `wound_photos` row for her summary and a *different* nurse cannot read it.
  (Reuse `adminClient`/`signedInClient` from `./helpers`; set nurse passwords via admin for sign-in.)

- [ ] **Step 2: Run** — `npm run test:rls` → all green (Plan-1 + Plan-2 + these). Confirm `node scripts/db-query.mjs -e "select count(*) from auth.users where email like '%@cc-loop.test';"` is 0 after.

- [ ] **Step 3: Commit** — `git add tests/rls/write-loop.itest.ts && git commit -m "test(portal): full write-loop lifecycle + photo RLS integration"`

- [ ] **Step 4: Live browser smoke (manual, the controller will do this):** mint nurse cookies (`node scripts/mint-session-cookies.mjs smoke_nurse@cc-smoke.test`), drive the dashboard → write a summary (incl. a photo) → submit; then mint coordinator cookies → review → publish; confirm via db-query the status is `published` and an audit trail of 3+ events exists.

---

## Done — what Plan 3 delivers (and the whole slice)

The full loop is live: schedule → nurse writes (with photos) → submit → coordinator reviews → publish → locked + family-visible, every transition audit-logged. Combined with Plans 1–2, slice L (nurse-write portal) is complete. Natural next step is slice M (the rich family read-view), which can now reuse `loadSummaryData` directly.

## Self-review notes
- **§3 lifecycle:** writer submit + review publish/send-back via the RPCs; read-only states block nurse edits (Task 3 Step 2). 
- **§4.4 review / §4.5 dashboard / §4.6 writer:** Tasks 4/2/3.
- **§5 photos:** upload (Task 3) + signed-URL display (mapper Task 1) + family-published RLS (Plan 1) + cross-nurse isolation test (Task 5).
- **Reuse:** `VisitSummaryDocument` unchanged; `toSummaryData` shared by preview + review + future family view.
- **Types:** RPC arg names match Plan 1 exactly (`target_summary_id`, `send_back_reason`).
