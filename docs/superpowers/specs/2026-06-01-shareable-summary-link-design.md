# Shareable Summary Link (Option C) — Design Spec

**Date:** 2026-06-01
**Status:** Approved in brainstorming session 2026-06-01.
**Builds on:** Phase 2 portal (slices J–N, L, M) — the published visit-summary lifecycle and the `VisitSummaryDocument` renderer.
**Goal:** Let a family read (and save) a visit summary from a link sent over WhatsApp — **no account, no login** — without putting patient data into the WhatsApp message itself.

---

## 1. Why

The diaspora audience lives on WhatsApp and "create an account / log in" is real friction. But the visit summary is PHI and must not be pasted into a WhatsApp chat (it would land on Meta's servers + the recipient's phone backups permanently). The WhatsApp Business API that could auto-send messages carries setup overhead + a recurring platform fee + per-message cost — premature for this stage.

**Solution:** the app generates a private, unguessable, expiring link to a single published summary. The coordinator sends that *link* (not the content) over their normal WhatsApp by hand — zero messaging cost, no API. The family taps it and reads the full rendered summary on a public page. PHI stays inside the app; only an opaque link travels through WhatsApp.

This is also the exact page a paid WhatsApp Business API integration would point at later, so nothing is throwaway.

---

## 2. Decisions locked (brainstorming)

- **Security model:** unguessable token + expiry only (no phone gate, no per-view code). A token exposes only its one **published** summary — never a list, never another family, never a draft.
- **Expiry:** **30 days** from link creation.
- **Delivery UX:** at publish time (and whenever revisiting a published summary), the review screen shows the link + **Copy** button + **Send on WhatsApp** button (prefilled "… visit summary is ready 👉 <link>").
- **Download:** a **Download / Print** button on the summary that opens the device print dialog → "Save as PDF" (works iPhone/Android/desktop). Reuses the existing `PrintButton` + the existing `@media print` styles.
- **Out of scope (YAGNI):** phone gate, WhatsApp Business API auto-send, per-view codes, link view analytics, true generated-PDF library (print-to-PDF is enough for now).

---

## 3. Architecture

### 3.1 New table — `summary_share_links`
One migration (`<timestamp>_summary_share_links.sql`).

| column | type | notes |
|--------|------|-------|
| `id` | uuid pk | default uuid_generate_v4() |
| `token` | text unique not null | ~32-char URL-safe random; the secret in the URL |
| `visit_summary_id` | uuid not null → visit_summaries(id) on delete cascade | the one summary it reveals |
| `expires_at` | timestamptz not null | created_at + 30 days |
| `created_by` | uuid → auth.users(id) | the coordinator who made it |
| `created_at` | timestamptz not null default now() | |

Index on `token`. **RLS enabled.** Policies: coordinator may select/insert (to create + re-display links); **no anon policy** — the public page does NOT read this table through RLS. (See 3.3.)

### 3.2 Token creation — `createShareLink(summaryId)` server action
- Coordinator-only (same role check as the other review actions).
- Only allowed when the summary is `published` (a link must never exist for a draft/in-review summary).
- **Idempotent-ish:** if a non-expired link already exists for that summary, return it; otherwise create a new one (avoids piling up tokens each time the coordinator reopens the page).
- Returns `{ token, expiresAt }`. The full URL is built client-side from `window.location.origin` (or `site.url`) as `/<locale>/s/<token>` — locale-prefixed to match the rest of the app.

### 3.3 Public read page — `app/[locale]/s/[token]/page.tsx`
- **Not** under `/portal`, so the auth layout never redirects it — no login required.
- Uses the **server-side admin client** (service-role, server-only) deliberately, because there is no logged-in user to satisfy RLS. This is safe because the page is *narrowly scoped*: it looks up exactly one token, and only proceeds if (a) the token exists, (b) `expires_at > now()`, and (c) the linked summary's `status = 'published'`. It can only ever return that single published summary — it never lists or exposes anything else.
- Renders the **same `VisitSummaryDocument`** via the existing mapping logic (refactor `loadSummaryData` so its DB-row→`VisitSummaryData` mapping can run with an injected client; wound-photo signed URLs generated server-side as today).
- States:
  - valid → render the document + a small "Shared summary · link valid until <date>" caption + the Download/Print button.
  - expired or unknown/garbage token or non-published → a friendly page: "This link has expired or is no longer available — please ask your coordinator for a new one." (Same page for all three, so a guesser can't tell the difference.)
- The page chrome (any header/caption) is `print:hidden`; only the document prints.

### 3.4 Surfacing the link in the UI — `ShareLinkPanel` (client)
- Shown on the review screen's **published** state (both the just-published success panel in `ReviewControls` and the already-published branch in `review/[summaryId]/page.tsx`).
- On mount/click it calls `createShareLink(summaryId)`, then shows: read-only link field, **Copy link** button (`navigator.clipboard`), **Send on WhatsApp** button (`https://wa.me/?text=<encoded message + link>`), and "Link works for 30 days."
- Dark-button text uses the inline-CSS-var pattern (Tailwind v4 quirk already documented in the repo).

### 3.5 Download / Print
- `VisitSummaryDocument` already includes `<PrintButton>` and `globals.css` already has the `@media print` block that isolates the document. Change: relabel the button copy from "Print summary" → "Download / Print" (i18n string) and confirm the public `/s/[token]` page's own chrome carries `print:hidden`. No new mechanism.

---

## 4. Files

| Path | Create / Modify | Responsibility |
|------|-----------------|----------------|
| `supabase/migrations/<ts>_summary_share_links.sql` | Create | table + index + RLS (coordinator-only) |
| `lib/supabase/types.ts` | Modify (regen) | include the new table |
| `lib/portal/summary.ts` | Modify | allow `loadSummaryData` mapping to run with an injected (admin) client; add `loadSummaryByToken(adminClient, token)` returning the doc or null per the 3.3 rules |
| `lib/portal/share.ts` | Create | `generateToken()` + 30-day expiry helper (pure, unit-tested) |
| `app/[locale]/portal/review/[summaryId]/actions.ts` | Modify | add `createShareLink(summaryId)` |
| `components/portal/ShareLinkPanel.tsx` | Create | link + Copy + WhatsApp UI |
| `components/portal/ReviewControls.tsx` | Modify | show `ShareLinkPanel` in the published success panel |
| `app/[locale]/portal/review/[summaryId]/page.tsx` | Modify | show `ShareLinkPanel` in the already-published branch |
| `app/[locale]/s/[token]/page.tsx` | Create | public no-login summary view |
| `components/portal/PrintButton.tsx` | (no change) | reused |
| `messages/en.json`, `messages/ar.json` | Modify | `portal.share.*` + relabel download; `share.expired.*` public-page copy |
| `tests/portal/share.test.ts` | Create | unit: token shape/uniqueness, expiry math |
| `tests/rls/share-link.itest.ts` | Create | integration: valid token shows published summary; expired hidden; non-published hidden; garbage token → null; coordinator-only create |

---

## 5. Security / compliance

- Token: ≥128 bits of entropy, URL-safe (`crypto.randomBytes`), unique-indexed.
- A token maps to exactly one summary and only renders it when **published** and **unexpired** — proven by integration tests.
- The admin client is used **only** in the public read path and **only** to fetch the single token-scoped summary; it is never exposed to the browser and never lists data.
- Wound photos remain private-bucket + short-lived signed URLs (generated per render).
- PHI never enters WhatsApp — only the opaque link does. The WhatsApp prefill text contains the patient's **display label** (already pseudonymous, e.g. "Mariam") + the link, nothing clinical.
- Expiry limits exposure of a leaked link to ≤30 days; coordinator can simply publish/share a fresh link if needed.
- No new PHI in logs.

---

## 6. Testing

- **Unit** (`npm test`): `generateToken` returns distinct, URL-safe, long tokens; expiry = created + 30d.
- **Integration** (`npm run test:rls`, real DB, `@cc-share.test` fixtures, self-cleaning):
  1. valid token → returns the published summary's data
  2. expired token → returns null (hidden)
  3. token whose summary is draft/in_review → null
  4. random/garbage token → null
  5. a non-coordinator cannot call create (RLS/role)
- **Build** green; **browser trial** (the run we agreed to do at the end): publish → copy link → open it in a fresh/incognito context with no session → confirm the full summary renders and Save-as-PDF works → confirm an expired/garbage token shows the friendly page.

---

## 7. Build order

1. Migration + regen types.
2. `lib/portal/share.ts` (+unit test) and `loadSummaryByToken` refactor.
3. Public `/s/[token]` page + friendly expired/unknown state.
4. `createShareLink` action + `ShareLinkPanel` + wire into the two published views.
5. Relabel download; confirm print isolation on the public page.
6. Integration tests; build; the live browser trial.
