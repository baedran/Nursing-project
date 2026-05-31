# Family Read-View — Design Spec (Slice M)

**Date:** 2026-05-31
**Status:** Approved in brainstorming session 2026-05-31 (visual decisions locked via companion). User delegated final sign-off to autonomous execution.
**Builds on:** Phase 2 slices J/K/N/L (the full nurse-write portal + published lifecycle).
**Completes:** the family side of the portal — the emotional payoff of the whole product (the daughter in Paris reading the real visit summary).

---

## 1. What this slice delivers

The portal already lets a coordinator and nurses produce published visit summaries. But a logged-in **family** still only sees a flat, non-clickable list of patient names plus a generic "sample summary" link. This slice makes the family side real: a family member clicks their patient, sees that patient's published visit summaries as a card list, and opens any one to read the full document (vitals, what was done, observations, meds, watch-for, **wound photos**, coordinator note) — the same `VisitSummaryDocument` the coordinator reviews, rendered read-only.

In one sentence: **a family can now actually read what happened at each visit.**

### In scope
- Family home: patient names become links to a patient page.
- Patient page (`/portal/patients/[patientId]`): card list of that patient's **published** visit summaries, newest flagged "Latest".
- Family summary view (`/portal/patients/[patientId]/visits/[summaryId]`): read-only render of the full summary via the existing `loadSummaryData` + `VisitSummaryDocument`, with wound photos shown via signed URLs.
- A family RLS integration test proving a family sees only their own patient's **published** summaries — nothing draft/in-review, nothing from another family.

### Out of scope (YAGNI)
- No "case" navigation layer — two-step patient→summary only (user-chosen).
- No family commenting, replies, reactions, or messaging.
- No notifications / email-on-publish.
- No PDF export beyond the existing in-document print button.
- No schema changes (none needed).

---

## 2. Navigation (locked)

Two steps, card-style list (both user-chosen in session):

```
FAMILY HOME                PATIENT PAGE                 SUMMARY VIEW
/portal (family)           /portal/patients/[id]        /portal/patients/[id]/visits/[summaryId]
─────────────              ───────────────              ──────────────────────
Mariam · Achrafieh  ─────▶ Visit summaries (cards):     Full VisitSummaryDocument
(now a link)               • Sun 31 May  [Latest] ─────▶  vitals · done · observations
                           • Thu 14 May          ─────▶  meds · watch-for
                           • Mon 11 May          ─────▶  wound photos (signed URLs)
                                                         coordinator note · print
```

Every page has a back link to its parent. All three are gated by the existing portal auth layout (logged-out → login).

---

## 3. Screens

### 3.1 Family home (modify `components/portal/FamilyHome.tsx`)
- The existing patient list becomes links: each patient card wrapped in `<Link href={/${locale}/portal/patients/${p.id}}>` with a hover-teal border and a right chevron, matching the coordinator queue card idiom.
- Keep the existing eyebrow/headline, the sample-summary CTA, and the sign-out button.
- Empty state unchanged.

### 3.2 Patient page (new `app/[locale]/portal/patients/[patientId]/page.tsx`)
- Server component. `await params` → `{ locale, patientId }`; validate locale; get user; the portal layout already guards auth.
- Load the patient (RLS ensures family-only): `patients.select("id, display_label, district").eq("id", patientId).single()`. If null → `notFound()` (covers both "doesn't exist" and "not your family").
- Load that patient's **published** summaries through the case→visit join, newest first:
  `visit_summaries.select("id, published_at, visits!inner(scheduled_at, cases!inner(case_ref, patient_id))").eq("visits.cases.patient_id", patientId).eq("status","published").order(...)`.
  (Family RLS already restricts visit_summaries to published + own-family, so this is also defence-in-depth.)
- Render the **card list** (chosen design): patient header (name · district · case ref), back link to `/portal`, then cards — newest gets a green left-edge + "Latest" chip; each card shows the Beirut-formatted visit date and links to the summary view. Empty state when none: "No visit summaries yet — you'll see one here within an hour of each visit."
- Reuse `formatBeirut` for dates and the existing card classes.

### 3.3 Family summary view (new `app/[locale]/portal/patients/[patientId]/visits/[summaryId]/page.tsx`)
- Server component. Guards: load summary via `loadSummaryData(supabase, summaryId)`; if null → `notFound()`. RLS guarantees the family can only load their own published summary, so no extra role check is needed; as defence-in-depth, confirm the loaded summary's patient matches `patientId` (else `notFound()`).
- Render the shell + a back link to the patient page + `<VisitSummaryDocument data={doc.data} />`. No coordinator controls. This mirrors the coordinator review page minus the controls and the `open_review` call.

---

## 4. Components & files

| Path | Create / Modify | Responsibility |
|------|-----------------|----------------|
| `components/portal/FamilyHome.tsx` | Modify | Patient names → links to patient page |
| `app/[locale]/portal/patients/[patientId]/page.tsx` | Create | Published-visit card list for a patient |
| `app/[locale]/portal/patients/[patientId]/visits/[summaryId]/page.tsx` | Create | Read-only family summary view |
| `messages/en.json`, `messages/ar.json` | Modify | `portal.patient.*` strings (header, latest chip, empty, back, readSummary) |
| `tests/rls/family-read.itest.ts` | Create | Family sees only own published summaries |

Reuses unchanged: `lib/portal/summary.ts` (`loadSummaryData`), `components/portal/VisitSummaryDocument.tsx`, `lib/portal/datetime.ts` (`formatBeirut`).

---

## 5. Data & security
- **Zero schema changes.** All RLS already in place from Plan 1 (family read = own family + `status='published'`, wound photos = published-only).
- The new integration test asserts: (a) a family reads its own published summary; (b) the same family does NOT see a draft/in-review summary for its own patient; (c) a different family sees zero of the first family's summaries; (d) a family cannot load another family's patient page data.
- Compliance carry-through: signed URLs only for photos (already in `loadSummaryData`); no PHI logged.

---

## 6. Build order
1. i18n strings.
2. Patient page + family-read integration test (test-first where practical).
3. Family summary view.
4. Link the family home.
5. Verify: build + unit + RLS green; browser smoke as a family user end-to-end.

---

## 7. Open questions resolved in session
- Navigation depth → **two steps (patient → summary)**, no case layer.
- Visit list treatment → **cards, newest flagged "Latest"**.
- Everything else → reuse existing render path; no new schema; YAGNI on comments/notifications/PDF.
