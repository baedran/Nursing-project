# Nurse-Write Portal — Design Spec (Slice L)

**Date:** 2026-05-30
**Status:** Approved in brainstorming session 2026-05-30; awaiting written-spec review before implementation plan
**Builds on:** Phase 2 slices J (`/what-we-send` summary template), K (Supabase foundation), N (auth + portal shell)
**Related:** Slice M (family-read view) is the natural follow-up and consumes the data this slice produces.

---

## 1. What this slice delivers

The portal currently lets a family log in and lets the coordinator see a placeholder home. This slice makes the portal *do something*: nurses log in, see the visits assigned to them, write a structured visit summary (including wound photos), and submit it. The coordinator reviews each submission and publishes it — only then does a family see it. Every state change is recorded in a tamper-proof log.

In one sentence: **this slice turns the portal from a shell into a working clinical-documentation pipeline, from visit assignment through to a published summary the family can read.**

### In scope

- Role-aware `/portal` home (family / nurse / coordinator each see a different landing)
- Coordinator: invite nurses, schedule & assign visits, review queue, publish / send-back
- Nurse: action-first dashboard, single-form summary writer with wound-photo upload, save-draft / preview / submit / fix-and-resubmit
- A 5-state summary lifecycle with a published-lock
- An append-only audit log of every summary state change
- Wound photo upload to the existing private bucket + signed-URL display

### Out of scope (explicit deferrals)

- **Family read-view** — the rich `VisitSummaryDocument` pulling live data is **slice M**. This slice leaves the family landing as-is.
- **Nurse self-signup / application flow** — nurses are invited by the coordinator only.
- **Editing a published summary / formal amendments** — published is locked. A correction workflow (tracked amendment) is a future slice; for now a mistake on a published summary is handled out-of-band.
- **Notifications** beyond the magic-link invite email — no "your summary was published" emails this round.
- **Rescheduling / cancelling visits UI** — coordinator can create+assign; editing an existing visit's schedule is deferred.
- **Coordinator-written summaries** — only the assigned nurse writes clinical content; the coordinator adds the coordinator note and publishes.

---

## 2. Roles & access model

Three roles already exist on `public.profiles.role`: `family`, `nurse`, `coordinator`. One login (magic link) for everyone; `/portal` branches on role.

| Role | `/portal` shows | Can do |
|------|-----------------|--------|
| **family** | Current family landing (unchanged this slice) | Read published summaries (full view = slice M) |
| **nurse** | Action-first dashboard | Write/edit/submit summaries for visits assigned to them; fix sent-back summaries; upload wound photos to their assigned visits |
| **coordinator** | Review queue + management links | Invite nurses; schedule & assign visits; review, publish, send-back; everything (RLS coordinator-all already in place) |

Role is read server-side from `profiles` on every portal request (the pattern already used in `app/[locale]/portal/page.tsx`). The portal home becomes a **router**: it reads the role and renders the matching home component.

---

## 3. The summary lifecycle (the core of this slice)

A visit summary moves through five states. State lives on a new `status` column on `visit_summaries`.

```
  draft ──submit──▶ submitted ──coordinator opens──▶ in_review
                                                        │
                          ┌──────send back─────────────┤
                          ▼                             │ publish
                  changes_requested                     ▼
                          │                         published  🔒 (locked)
                          └──nurse edits & resubmits──▶ submitted (loop)
```

| State | Meaning | Who can edit | Who can see |
|-------|---------|--------------|-------------|
| `draft` | Nurse is still writing | Assigned nurse | Nurse + coordinator |
| `submitted` | Nurse has handed it off | No one edits clinical body; coordinator can open it | Nurse (read) + coordinator |
| `in_review` | Coordinator has opened it and is working on it | Coordinator (coordinator_note only) | Nurse (read) + coordinator |
| `changes_requested` | Coordinator sent it back with a reason | Assigned nurse | Nurse + coordinator |
| `published` | Live to the family | **No one** (locked) | Nurse (read) + coordinator + family |

**Rules:**
- The nurse owns the **clinical content** (vitals, what-was-done, observations, meds, watch-for, next-visit, photos). Editable in `draft` and `changes_requested` only.
- The coordinator owns the **`coordinator_note`** and the **publish decision**. Editable while `in_review`.
- `in_review` is set automatically when the coordinator opens a `submitted` summary in the review screen (so two coordinators — future — don't collide; today it's just you).
- **Published is terminal and locked.** No edits by anyone. This is the PHI-integrity guarantee: a clinical record a family has read is never silently altered.
- `sent_back_reason` is captured when moving to `changes_requested` and shown to the nurse on their dashboard and in the writer.

### Replaces `finalised`
The foundation's `visit_summaries.finalised` boolean is superseded by `status`. `published` is the new "locked" line. Migration keeps `finalised` for now (set `finalised = (status = 'published')` via the publish action) to avoid breaking the slice-J/N seed data, but **`status` is the source of truth** going forward. A later cleanup migration can drop `finalised`.

---

## 4. Screens

Six new surfaces, all under `app/[locale]/portal/`. All server-rendered with the existing Supabase server client; mutations are Next.js Server Actions (the pattern already used in `login/actions.ts`).

### 4.1 Coordinator home (`/portal`, role = coordinator)
- **Review queue** at the top: summaries in `submitted` or `in_review`, each row = patient · case · nurse · visit date → **Review →**.
- Secondary: count of nurses' summaries `draft` / `changes_requested` in flight (read-only awareness).
- Two action buttons: **Manage nurses** (`/portal/nurses`) and **Schedule a visit** (`/portal/schedule`).
- Keeps the existing patients list + sample-summary CTA below, or moves them under a "Reference" heading.

### 4.2 Manage nurses (`/portal/nurses`)
- Table of nurses: display name, hospital, license, active toggle, date added.
- **Add nurse** form: name, hospital, email, license number, certifications (optional multi-entry).
- On submit (Server Action using the **admin client**, server-only): create/invite auth user with `inviteUserByEmail` (sends magic link), set their `profiles.role = 'nurse'`, insert their `nurses` row linked to that user. Errors surfaced inline (e.g., email already exists).

### 4.3 Schedule a visit (`/portal/schedule`)
- Form: choose patient (→ its active case, or choose case), date/time, assign nurse from the roster.
- On submit: insert a `visits` row with `assigned_nurse_id` set and `status = 'scheduled'`.
- Confirmation shows the visit now appears on that nurse's dashboard.
- Visit `status` will be advanced to `completed` by the nurse implicitly when they submit a summary (see §6 note), or left as a coordinator concern — **decision: submitting a summary marks the visit `completed`.**

### 4.4 Review a summary (`/portal/review/[summaryId]`)
- Renders the submission **in the real family-document layout** (reuse `VisitSummaryDocument`) so you see exactly what the family will get.
- Opening a `submitted` summary moves it to `in_review`.
- A coordinator-note textarea (editable).
- Two actions: **Publish** (→ `published`, locked, visible to family) and **Send back** (requires a short reason → `changes_requested`).

### 4.5 Nurse dashboard (`/portal`, role = nurse)
Action-first layout (chosen in session):
- **Needs your write-up** — assigned visits with no summary yet, or summary in `draft`. → **Write summary →**
- **Sent back to fix** — summaries in `changes_requested`, showing the coordinator's reason. → **Edit →**
- **History** (muted) — `submitted` / `in_review` ("with coordinator") and `published`, read-only.

### 4.6 Write summary (`/portal/visits/[visitId]/summary`)
Single scrolling form (chosen in session), phone-first:
- Context header: patient · case · visit date.
- **Vitals** (BP / HR / SpO₂ / Temp — 4 fields, stored in the existing `vitals` jsonb).
- **What was done** (textarea → `done_body`).
- **Observations** (textarea → `observations_body`).
- **Medications given** (repeatable list → `meds_administered` text[]).
- **Watch for** (repeatable list → `watch_items` text[]).
- **Next visit** (textarea → `next_visit_body`).
- **Wound photos** (upload, see §5).
- Sticky action bar: draft auto/save state, **Preview** (renders `VisitSummaryDocument` with current values), **Save draft**, **Submit for review**.
- If the summary is `changes_requested`, the coordinator's reason shows at the top; submitting returns it to `submitted`.

---

## 5. Wound photos

Foundation already exists: private `wound-photos` bucket, `wound_photos` table, RLS + storage policies keyed to path `families/{family_id}/...`.

- **Upload (nurse, in the writer):** file picker → upload to `families/{family_id}/visit-{visitId}/{uuid}.{ext}` via the server (storage policy already allows active nurses to insert). Insert a `wound_photos` row (`visit_summary_id`, `storage_path`, optional caption, `taken_at`).
- **Display (review + family):** generate a short-lived **signed URL** server-side for each photo; never expose the raw object path or a public URL.
- The existing "Private content" placeholder in `VisitSummaryDocument` becomes the real signed-URL image when one is available, falling back to the placeholder when not (e.g., unauthorised or no photo).
- Constraints already enforced by the bucket: 10 MB max, jpeg/png/webp only.
- **Never log** file contents, paths tied to patient identity, or captions.

---

## 6. Data / schema changes

One new migration (`supabase/migrations/<timestamp>_nurse_write.sql`, timestamp generated at build time per the existing `YYYYMMDDHHMMSS_*` convention). No destructive changes to existing tables.

1. **`visit_summaries.status`** — `text not null default 'draft'` with `check (status in ('draft','submitted','in_review','changes_requested','published'))`. Index on `status`.
2. **`visit_summaries.sent_back_reason`** — `text` (nullable). (`coordinator_note` already exists.)
3. **`visit_summaries.submitted_at`, `published_at`** — `timestamptz` nullable, for the audit/timeline and family display.
4. **`visit_summary_events`** (new, append-only audit log):
   - `id`, `visit_summary_id` (fk), `actor_user_id` (fk auth.users), `from_status`, `to_status`, `reason` (nullable), `created_at`.
   - RLS: insert allowed to coordinator + the assigned nurse for that summary; **no update, no delete** for anyone (append-only). Select: coordinator + assigned nurse + family members of the patient (so a future family timeline is possible).
5. **RLS updates on `visit_summaries`:**
   - Retarget the nurse-update policy from `finalised = false` to `status in ('draft','changes_requested')`.
   - Keep coordinator-all.
   - Family select policy already restricts to their visits; **add `and status = 'published'`** so families never see drafts/in-review content. *(This is a tightening of the existing family-read policy and is required before slice M.)*
6. **Nurse invite** uses the **admin client** (`lib/supabase/admin.ts`, service-role, server-only) for `inviteUserByEmail` + role/`nurses` row creation. Service-role key never reaches the browser.

After the migration, regenerate `lib/supabase/types.ts` (per `supabase/README.md`).

---

## 7. Components & files (anticipated)

New/changed (final list firmed up in the implementation plan):

- `app/[locale]/portal/page.tsx` — becomes a role router → renders one of three home components.
- `components/portal/CoordinatorHome.tsx`, `NurseDashboard.tsx` (+ keep family home inline or extract `FamilyHome.tsx`).
- `app/[locale]/portal/nurses/page.tsx` + `actions.ts` (add-nurse).
- `app/[locale]/portal/schedule/page.tsx` + `actions.ts` (create-visit).
- `app/[locale]/portal/review/[summaryId]/page.tsx` + `actions.ts` (open→in_review, publish, send-back).
- `app/[locale]/portal/visits/[visitId]/summary/page.tsx` + `actions.ts` (save-draft, submit) + a client form component for the repeatable lists + preview toggle + photo upload.
- `components/portal/SummaryForm.tsx` (client) and a small `WoundPhotoUploader.tsx`.
- Reuse `components/portal/VisitSummaryDocument.tsx` for Preview and Review (it already takes a `VisitSummaryData` prop; we add a server-side mapper from DB rows → `VisitSummaryData`).
- `lib/portal/summary.ts` — maps DB `visit_summaries` (+ joins + signed photo URLs) into `VisitSummaryData`; shared by writer-preview, review, and (later) slice M.
- New migration + regenerated `types.ts`.
- Copy strings added to `messages/en.json` (and `ar.json` placeholders) under a `portal.*` namespace, matching the existing i18n pattern.

---

## 8. Compliance notes (carry-through from CLAUDE.md)

- RLS on every patient-touching table — this slice **tightens** family-read to published-only and adds append-only audit RLS.
- Wound photos: private bucket, signed URLs only, never public.
- Never log PHI: no names, vitals, photo paths, or captions in logs or analytics.
- Service-role/admin client used only server-side, only for the nurse-invite action.
- Published-lock + append-only event log = the defensible-record guarantee.

---

## 9. Build order (high level — detailed plan is the next deliverable)

1. Migration: `status`, timestamps, `sent_back_reason`, `visit_summary_events`, RLS updates; regenerate types.
2. Portal role router + three home shells.
3. Coordinator: manage-nurses (invite) → schedule-visit. (Unblocks having a nurse + an assigned visit to test with.)
4. Nurse: dashboard → summary writer (text fields first, preview, save-draft, submit).
5. Coordinator: review screen → publish / send-back; wire the audit log on every transition.
6. Wound photo upload + signed-URL display in writer-preview and review.
7. Manual QA of the full loop (assign → write → submit → review → send back → fix → resubmit → publish) + mobile pass on the writer.

---

## 10. Open questions resolved in session

- Nurse onboarding → **coordinator invites** (not self-signup, not seed-only).
- Review step → **coordinator reviews then publishes** (not direct nurse publish).
- Visit creation → **coordinator schedules & assigns in-app** (not seed-only).
- Dashboard → **action-first** (not timeline).
- Writer → **single form + Preview button** (not live split).
- Wound photos → **included this slice**.
- Audit log → **included** (the "private logbook").
