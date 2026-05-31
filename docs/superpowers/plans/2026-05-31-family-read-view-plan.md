# Family Read-View — Implementation Plan (Slice M)

**Goal:** Let a logged-in family member click their patient → see published visit summaries as cards → open the full read-only summary.

**Architecture:** Two new family-only server pages under `app/[locale]/portal/patients/`, a small edit to `FamilyHome` to link patients, and i18n strings. Reuses `loadSummaryData` + `VisitSummaryDocument` + `formatBeirut` unchanged. No schema changes — existing RLS already restricts family reads to own-family published summaries. One new RLS integration test for defence-in-depth.

**Spec:** `docs/superpowers/specs/2026-05-31-family-read-view-design.md`.

---

## Task 1 — i18n strings
Add `portal.patient` block to `messages/en.json` and `messages/ar.json` (ar = same English placeholders):
```json
"patient": {
  "eyebrow": "Patient",
  "back": "Back to your family",
  "visitsLabel": "Visit summaries",
  "latest": "Latest",
  "empty": "No visit summaries yet — you'll see one here within an hour of each visit.",
  "readSummary": "Read summary",
  "backToPatient": "Back to visits"
}
```

## Task 2 — Patient page
`app/[locale]/portal/patients/[patientId]/page.tsx` (server). Guard locale + user (layout guards auth). Load patient via RLS; `notFound()` if null. Load published summaries newest-first. Render shell (760px) + back link to `/portal` + header (name · district · case ref) + card list (newest = green left-edge + "Latest" chip), each linking to the summary view; empty state otherwise. Use `formatBeirut` for dates.

## Task 3 — Family summary view
`app/[locale]/portal/patients/[patientId]/visits/[summaryId]/page.tsx` (server). `loadSummaryData(supabase, summaryId)`; `notFound()` if null OR if its patient ≠ `patientId`. Render shell + back link to patient page + `<VisitSummaryDocument data={doc.data} />`. No controls.

## Task 4 — Link family home
`components/portal/FamilyHome.tsx`: wrap each patient card in a `<Link>` to `/portal/patients/${p.id}` with hover-teal + chevron.

## Task 5 — RLS integration test
`tests/rls/family-read.itest.ts` (@cc-fam.test fixtures): family A reads own published summary; family A does NOT see own draft summary; family B sees zero of A's summaries; family B cannot read A's patient row. Teardown removes only fixtures.

## Verify
`npm test` + `npm run test:rls` + `npm run build` all green; browser smoke as a family user: home → patient → summary (with a published seed).
