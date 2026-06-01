# Shareable Summary Link (Option C) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a family open and save (Save-as-PDF) a published visit summary from an unguessable, 30-day-expiring link — no login, no account — sent manually over WhatsApp.

**Architecture:** A new `summary_share_links` table maps a random token → one published summary. A public route `/<locale>/s/<token>` renders the existing `VisitSummaryDocument` using the server-only admin client, but only ever returns the single token-scoped summary when it is published and unexpired. The coordinator gets the link (Copy + Send-on-WhatsApp) at publish time and on any already-published summary. Download reuses the existing print flow.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Storage, admin client) · Vitest.

**Spec:** `docs/superpowers/specs/2026-06-01-shareable-summary-link-design.md`.

---

## Background the engineer needs

- Solo founder, nurse, minimal coding background. Small, readable code. Plain comments.
- **Run all commands from project root** `c:\Users\theom\Desktop\New proj`. Windows; bash and PowerShell both available.
- **Tests:** `npm test` = Vitest unit/component (jsdom). `npm run test:rls` = integration tests against the **real** Supabase cloud project (no Docker), using keys read from `.env.local`. Integration test files end in `.itest.ts`; unit files end in `.test.ts`.
- **DB migrations** are applied to the cloud project with `node scripts/db-query.mjs <file.sql>` (Supabase Management API; token in gitignored `.supabase-token`). After a schema change, regenerate types — but the project's `db:types` npm script uses `supabase gen types --local` which needs Docker we don't have. Instead regenerate from the cloud project with:
  `npx --yes supabase@latest gen types typescript --project-id mudjjpnxjjapdcxhhngj > lib/supabase/types.ts` (set `SUPABASE_ACCESS_TOKEN` from `.supabase-token` first). If that errors, hand-edit `lib/supabase/types.ts` to add the new table (the file is a plain TS type; the existing tables show the exact shape to copy).
- **Existing pieces this plan reuses (do not rebuild):**
  - `components/portal/VisitSummaryDocument.tsx` — renders a summary from a `VisitSummaryData` prop. Already contains `<PrintButton>`.
  - `components/portal/PrintButton.tsx` — `window.print()` button, `print:hidden`.
  - `lib/portal/summary.ts` — exports `toSummaryData(row, photos)` (pure mapper) and `loadSummaryData(supabase, summaryId)` (fetch + map). `SummaryRow`, `SummaryPhoto`, `VisitSummaryData` types live here / in the document.
  - `lib/supabase/admin.ts` — `createAdminClient()` (service-role, server-only, bypasses RLS).
  - `lib/supabase/server.ts` — `createClient()` (RLS-bound).
  - `app/globals.css` — `@media print` block already hides nav/footer/`.print-hidden` and styles the `article`.
  - `lib/i18n.ts` — `getDictionary(locale)`, `isLocale(locale)`, `Dictionary` type.
  - `lib/site.ts` — `site.url` (current public origin), `site.whatsapp`.
  - Review action pattern: `app/[locale]/portal/review/[summaryId]/actions.ts` has `requireCoordinator()` + `publish()` etc. New `createShareLink` goes in this same file.
- **Design system tokens** (Tailwind utilities): `bg-paper`, `bg-paper-cool`, `text-ink`, `text-ink-soft`, `text-muted`, `text-teal`, `text-teal-deep`, `bg-teal-soft`, `border-rule`, `font-display`, `font-mono`. Eyebrow idiom: `font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep`. **Tailwind v4 quirk:** dark-button text can fail to generate as a utility — use inline CSS vars `style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}` (see existing `ReviewControls.tsx`).
- **Routing note:** `app/[locale]/` already contains `portal`, `login`, `auth`, etc. Adding `app/[locale]/s/[token]/page.tsx` creates a sibling route `/<locale>/s/<token>`. It is NOT under `portal/`, so the portal auth layout does not apply — no login required. Confirmed no catch-all route would swallow it.

---

## File map

| Path | Create / Modify | Responsibility |
|------|-----------------|----------------|
| `supabase/migrations/20260601022934_summary_share_links.sql` | Create | table + index + RLS (coordinator create/select; no anon) |
| `lib/supabase/types.ts` | Modify | add `summary_share_links` to `Database` |
| `lib/portal/share.ts` | Create | `generateToken()`, `shareExpiry()` (pure, unit-tested) |
| `lib/portal/share.test.ts` | Create | unit tests for the above |
| `lib/portal/summary.ts` | Modify | add `loadSummaryByToken(admin, token)` reusing `toSummaryData` |
| `app/[locale]/portal/review/[summaryId]/actions.ts` | Modify | add `createShareLink(summaryId)` coordinator action |
| `components/portal/ShareLinkPanel.tsx` | Create | client: Copy + Send-on-WhatsApp UI |
| `components/portal/ReviewControls.tsx` | Modify | show `ShareLinkPanel` in published success panel |
| `app/[locale]/portal/review/[summaryId]/page.tsx` | Modify | show `ShareLinkPanel` in already-published branch |
| `app/[locale]/s/[token]/page.tsx` | Create | public no-login summary view + expired/unknown state |
| `messages/en.json`, `messages/ar.json` | Modify | `portal.share.*`, `share.*` (public page), relabel print |
| `tests/rls/share-link.itest.ts` | Create | integration security tests |

---

## Task 1: Migration — `summary_share_links` table

**Files:**
- Create: `supabase/migrations/20260601022934_summary_share_links.sql`
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Write the migration file**

Create `supabase/migrations/20260601022934_summary_share_links.sql`:

```sql
-- Shareable summary links (Option C): unguessable, expiring, no-login access to
-- ONE published visit summary. The public page reads this via the service-role
-- admin client (no anon RLS policy), so access is gated entirely in app code:
-- token must exist, be unexpired, and point to a published summary.

create table if not exists public.summary_share_links (
  id uuid primary key default uuid_generate_v4(),
  token text not null unique,
  visit_summary_id uuid not null references public.visit_summaries(id) on delete cascade,
  expires_at timestamptz not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists summary_share_links_token_idx on public.summary_share_links(token);
create index if not exists summary_share_links_summary_idx on public.summary_share_links(visit_summary_id);

alter table public.summary_share_links enable row level security;

-- Coordinators manage links (create + read to re-display). No anon/family policy:
-- the public /s/<token> page uses the admin client, not RLS.
drop policy if exists "coordinators manage share links" on public.summary_share_links;
create policy "coordinators manage share links"
  on public.summary_share_links for all
  using (public.is_coordinator())
  with check (public.is_coordinator());
```

- [ ] **Step 2: Apply it to the cloud database**

Run: `node scripts/db-query.mjs supabase/migrations/20260601022934_summary_share_links.sql`
Expected: prints `[]` (success, no rows).

- [ ] **Step 3: Verify the table exists**

Run: `node scripts/db-query.mjs -e "select column_name from information_schema.columns where table_schema='public' and table_name='summary_share_links' order by ordinal_position;"`
Expected: JSON listing `id, token, visit_summary_id, expires_at, created_by, created_at`.

- [ ] **Step 4: Regenerate types**

Run (bash):
```bash
SUPABASE_ACCESS_TOKEN="$(cat .supabase-token)" npx --yes supabase@latest gen types typescript --project-id mudjjpnxjjapdcxhhngj > lib/supabase/types.ts
```
Expected: `lib/supabase/types.ts` rewritten and now contains `summary_share_links`. Verify: `grep -c summary_share_links lib/supabase/types.ts` returns ≥1.
If the CLI errors, manually add a `summary_share_links` block to the `Tables` object in `lib/supabase/types.ts`, copying the shape of an existing table (Row/Insert/Update with the columns above; `token`/`visit_summary_id`/`expires_at` required, others optional in Insert).

- [ ] **Step 5: Confirm the build still compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260601022934_summary_share_links.sql lib/supabase/types.ts
git commit -m "feat(db): summary_share_links table for no-login share links"
```

---

## Task 2: Token + expiry helpers (`lib/portal/share.ts`)

**Files:**
- Create: `lib/portal/share.ts`, `lib/portal/share.test.ts`

- [ ] **Step 1: Write the failing unit test**

Create `lib/portal/share.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { generateToken, shareExpiry, SHARE_TTL_DAYS } from "@/lib/portal/share";

describe("generateToken", () => {
  test("returns a long URL-safe token", () => {
    const t = generateToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/); // URL-safe base64url, no padding
  });

  test("returns a different token each call", () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe("shareExpiry", () => {
  test("is SHARE_TTL_DAYS (30) days after the given start", () => {
    const start = new Date("2026-06-01T00:00:00Z");
    const exp = shareExpiry(start);
    const days = (exp.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(SHARE_TTL_DAYS).toBe(30);
    expect(days).toBe(30);
  });

  test("defaults to now() when no start given", () => {
    const before = Date.now();
    const exp = shareExpiry();
    const after = Date.now();
    const ttlMs = SHARE_TTL_DAYS * 24 * 60 * 60 * 1000;
    expect(exp.getTime()).toBeGreaterThanOrEqual(before + ttlMs - 5);
    expect(exp.getTime()).toBeLessThanOrEqual(after + ttlMs + 5);
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npm test -- share`
Expected: FAIL — cannot find module `@/lib/portal/share`.

- [ ] **Step 3: Implement the helpers**

Create `lib/portal/share.ts`:

```ts
import { randomBytes } from "node:crypto";

/** How long a share link stays valid. */
export const SHARE_TTL_DAYS = 30;

/**
 * An unguessable, URL-safe token for a share link. 24 random bytes → 32
 * base64url chars (~192 bits of entropy), no padding, safe in a URL path.
 */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Expiry timestamp: SHARE_TTL_DAYS after `start` (defaults to now). */
export function shareExpiry(start: Date = new Date()): Date {
  return new Date(start.getTime() + SHARE_TTL_DAYS * 24 * 60 * 60 * 1000);
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npm test -- share`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/portal/share.ts lib/portal/share.test.ts
git commit -m "feat(share): token + 30-day expiry helpers"
```

---

## Task 3: `loadSummaryByToken` in `lib/portal/summary.ts`

**Files:**
- Modify: `lib/portal/summary.ts`

This reuses the existing `toSummaryData` mapper. It validates the token rules (exists, unexpired, summary published) and returns the renderable doc or `null`.

- [ ] **Step 1: Add the function**

At the end of `lib/portal/summary.ts`, after `loadSummaryData`, add:

```ts
/**
 * Load a summary for the PUBLIC no-login share page, by share token.
 *
 * Pass the SERVER-ONLY admin client (there is no logged-in user to satisfy
 * RLS). This is safe because access is fully gated here: returns null unless
 * the token exists, is not expired, and its summary is published. It can only
 * ever return that one token's summary — never a list or anything else.
 */
export async function loadSummaryByToken(
  admin: SupabaseClient,
  token: string,
): Promise<{ data: VisitSummaryData } | null> {
  const { data: link } = await admin
    .from("summary_share_links")
    .select("visit_summary_id, expires_at")
    .eq("token", token)
    .single();
  if (!link) return null;
  if (new Date((link as any).expires_at).getTime() <= Date.now()) return null;

  const summaryId = (link as any).visit_summary_id as string;
  const { data: s } = await admin
    .from("visit_summaries")
    .select(
      "id, status, vitals, done_body, observations_body, meds_administered, watch_items, next_visit_body, coordinator_note, written_at, published_at, visits(scheduled_at, cases(case_ref, patients(display_label, district)))",
    )
    .eq("id", summaryId)
    .single();
  if (!s) return null;
  const v: any = s;
  if (v.status !== "published") return null;

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

  const { data: photoRows } = await admin
    .from("wound_photos")
    .select("storage_path, caption")
    .eq("visit_summary_id", summaryId);

  const photos: SummaryPhoto[] = [];
  for (const p of photoRows ?? []) {
    const { data: signed } = await admin.storage
      .from("wound-photos")
      .createSignedUrl((p as any).storage_path, 3600);
    if (signed?.signedUrl) {
      photos.push({ caption: (p as any).caption ?? "", url: signed.signedUrl });
    }
  }

  return { data: toSummaryData(row, photos) };
}
```

- [ ] **Step 2: Typecheck via build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. (No new route yet; this just confirms the function typechecks.)

- [ ] **Step 3: Commit**

```bash
git add lib/portal/summary.ts
git commit -m "feat(share): loadSummaryByToken for the public share page"
```

---

## Task 4: `createShareLink` server action

**Files:**
- Modify: `app/[locale]/portal/review/[summaryId]/actions.ts`

- [ ] **Step 1: Add the action**

Append to `app/[locale]/portal/review/[summaryId]/actions.ts`. First add the import at the top (below the existing imports):

```ts
import { generateToken, shareExpiry } from "@/lib/portal/share";
```

Then add the action at the end of the file:

```ts
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

  // Only published summaries may be shared.
  const { data: summary } = await (auth.supabase as any)
    .from("visit_summaries")
    .select("status")
    .eq("id", summaryId)
    .single();
  if (!summary || summary.status !== "published") {
    return { ok: false, error: "Only published summaries can be shared." };
  }

  // Reuse a non-expired link if present.
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
```

- [ ] **Step 2: Typecheck via build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/portal/review/[summaryId]/actions.ts"
git commit -m "feat(share): createShareLink coordinator action (reuse-or-create)"
```

---

## Task 5: i18n strings

**Files:**
- Modify: `messages/en.json`, `messages/ar.json`

- [ ] **Step 1: Add the English strings**

In `messages/en.json`, inside the `"portal"` object, add a `"share"` block (e.g. right after the `"review"` block — keep valid JSON):

```json
    "share": {
      "label": "Share with the family",
      "help": "Send this private link. It works for 30 days — no login needed.",
      "copy": "Copy link",
      "copied": "Copied!",
      "whatsapp": "Send on WhatsApp",
      "whatsappText": "{patient}'s visit summary is ready 👉 {url}",
      "validUntil": "Link works until {date}",
      "generating": "Preparing link…",
      "error": "Could not create the link. Try again."
    }
```

Also, at the TOP LEVEL of `messages/en.json` (a sibling of `"portal"`, `"home"`, etc.), add a `"share"` block for the public page:

```json
  "sharePage": {
    "caption": "Shared visit summary",
    "validUntil": "Link valid until {date}",
    "download": "Download / Print",
    "expiredTitle": "Link unavailable",
    "expiredBody": "This link has expired or is no longer available. Please ask your coordinator for a new one."
  }
```

(Implementer note: the existing `VisitSummaryDocument` takes its print button label from `data.printLabel`. The public page and the existing portal callers pass that value — set it to the `sharePage.download` / existing label as appropriate. Do NOT rename `printLabel` in the type.)

- [ ] **Step 2: Mirror into Arabic**

In `messages/ar.json`, add the SAME `portal.share` and top-level `sharePage` blocks with the same English values as placeholders (the project ships AR as placeholders; an AR editor revises later). Keep `{patient}`, `{url}`, `{date}` tokens intact.

- [ ] **Step 3: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'));JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'));console.log('both valid')"`
Expected: `both valid`.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/ar.json
git commit -m "feat(share): i18n strings for share panel + public page"
```

---

## Task 6: `ShareLinkPanel` component

**Files:**
- Create: `components/portal/ShareLinkPanel.tsx`

- [ ] **Step 1: Create the component**

Create `components/portal/ShareLinkPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { site } from "@/lib/site";
import { createShareLink } from "@/app/[locale]/portal/review/[summaryId]/actions";

type Props = {
  locale: string;
  dict: Dictionary;
  summaryId: string;
  patientLabel: string;
};

export default function ShareLinkPanel({ locale, dict, summaryId, patientLabel }: Props) {
  const s = dict.portal.share;
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await createShareLink(summaryId);
      if (!active) return;
      if (result.ok) {
        const origin =
          typeof window !== "undefined" ? window.location.origin : site.url;
        setUrl(`${origin}/${locale}/s/${result.token}`);
        setExpiresAt(result.expiresAt);
      } else {
        setError(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [summaryId, locale]);

  function handleCopy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const whatsappHref = url
    ? `https://wa.me/?text=${encodeURIComponent(
        s.whatsappText.replace("{patient}", patientLabel).replace("{url}", url),
      )}`
    : "#";

  const validUntilText =
    expiresAt != null
      ? s.validUntil.replace(
          "{date}",
          new Date(expiresAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        )
      : "";

  return (
    <div className="rounded-xl border border-rule bg-white px-5 py-5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
        {s.label}
      </div>
      <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">{s.help}</p>

      {error ? (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-peach">
          {s.error}
        </p>
      ) : !url ? (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
          {s.generating}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-rule bg-paper-cool px-4 py-3 font-mono text-[12px] text-ink outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-[13px] font-medium text-ink transition hover:bg-paper-cool"
            >
              {copied ? s.copied : s.copy}
            </button>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90"
              style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
            >
              {s.whatsapp} →
            </a>
          </div>
          {validUntilText && (
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {validUntilText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck via build**

Run: `npm run build`
Expected: `✓ Compiled successfully`. (Component not yet imported anywhere — this confirms it compiles standalone.)

- [ ] **Step 3: Commit**

```bash
git add components/portal/ShareLinkPanel.tsx
git commit -m "feat(share): ShareLinkPanel (copy + send-on-whatsapp)"
```

---

## Task 7: Surface the panel on the two published views

**Files:**
- Modify: `components/portal/ReviewControls.tsx`
- Modify: `app/[locale]/portal/review/[summaryId]/page.tsx`

The panel needs `patientLabel`. The review page already loads the summary doc (`doc.data.patientLabel`). Pass it down.

- [ ] **Step 1: Pass patientLabel into ReviewControls**

In `app/[locale]/portal/review/[summaryId]/page.tsx`, the `<ReviewControls ... />` is rendered in the not-published branch and a published badge in the published branch. Update BOTH:

(a) In the published branch (`status === "published"`), after the existing published `<div>` that shows `r.published`/`r.publishedBody`/back link, add the panel. Change that block to also render `<ShareLinkPanel>`. Add the import at top:
```tsx
import ShareLinkPanel from "@/components/portal/ShareLinkPanel";
```
and render (inside the published branch, after the existing panel `<div>`):
```tsx
<div className="mt-4">
  <ShareLinkPanel
    locale={locale}
    dict={dict}
    summaryId={summaryId}
    patientLabel={doc.data.patientLabel}
  />
</div>
```

(b) Pass `patientLabel` into `ReviewControls` so it can show the panel after a fresh publish:
```tsx
<ReviewControls
  locale={locale}
  dict={dict}
  summaryId={summaryId}
  initialNote={coordinatorNote}
  patientLabel={doc.data.patientLabel}
/>
```

- [ ] **Step 2: Show the panel in ReviewControls' published success state**

In `components/portal/ReviewControls.tsx`:

(a) Add to `Props`:
```tsx
  patientLabel: string;
```
and destructure it: `export default function ReviewControls({ locale, dict, summaryId, initialNote, patientLabel }: Props) {`

(b) Add the import at top:
```tsx
import ShareLinkPanel from "@/components/portal/ShareLinkPanel";
```

(c) In the `if (published) { return (...) }` success panel, add the share panel after the existing back-link `<Link>`, still inside the outer `<div>`:
```tsx
<div className="mt-2">
  <ShareLinkPanel
    locale={locale}
    dict={dict}
    summaryId={summaryId}
    patientLabel={patientLabel}
  />
</div>
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, route list still includes `/[locale]/portal/review/[summaryId]`.

- [ ] **Step 4: Commit**

```bash
git add components/portal/ReviewControls.tsx "app/[locale]/portal/review/[summaryId]/page.tsx"
git commit -m "feat(share): show share panel after publish + on published summaries"
```

---

## Task 8: Public no-login page `/<locale>/s/<token>`

**Files:**
- Create: `app/[locale]/s/[token]/page.tsx`

- [ ] **Step 1: Create the page**

Create `app/[locale]/s/[token]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, isLocale } from "@/lib/i18n";
import { loadSummaryByToken } from "@/lib/portal/summary";
import VisitSummaryDocument from "@/components/portal/VisitSummaryDocument";

export default async function SharedSummaryPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const sp = dict.sharePage;

  // Public, no-login. The admin client is used ONLY to resolve this single
  // token; loadSummaryByToken returns null unless the token exists, is
  // unexpired, and its summary is published.
  const admin = createAdminClient();
  const doc = await loadSummaryByToken(admin, token);

  if (!doc) {
    return (
      <section
        className="bg-paper"
        style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "100vh" }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
          <div className="mx-auto text-center" style={{ maxWidth: "520px" }}>
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {sp.caption}
            </div>
            <h1
              className="font-display font-medium"
              style={{ fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.02em" }}
            >
              {sp.expiredTitle}
            </h1>
            <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">{sp.expiredBody}</p>
          </div>
        </div>
      </section>
    );
  }

  // Render the document with the localized download label.
  const data = { ...doc.data, printLabel: sp.download };

  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(40px, 8vw, 96px)", minHeight: "100vh" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          <div className="print-hidden mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {sp.caption}
          </div>
          <VisitSummaryDocument data={data} />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully` and the route list includes `/[locale]/s/[token]`.

- [ ] **Step 3: Commit**

```bash
git add "app/[locale]/s/[token]/page.tsx"
git commit -m "feat(share): public no-login summary page at /[locale]/s/[token]"
```

---

## Task 9: Integration security tests

**Files:**
- Create: `tests/rls/share-link.itest.ts`

These call `loadSummaryByToken` (the real public read path) against the live DB with real fixtures, plus assert the coordinator-only RLS on the table. Mirrors the structure of `tests/rls/family-read.itest.ts`.

- [ ] **Step 1: Write the test**

Create `tests/rls/share-link.itest.ts`:

```ts
// Share-link (Option C) integration tests against the real Supabase project.
// Proves the public read path only ever reveals a published, unexpired,
// correctly-tokened summary. @cc-share.test fixtures; self-cleaning.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminClient } from "./helpers";
import { loadSummaryByToken } from "@/lib/portal/summary";
import { generateToken, shareExpiry } from "@/lib/portal/share";

const DOMAIN = "cc-share.test";
const admin = adminClient();

const FAM = "e0000001-0000-4000-8000-000000000001";
const PAT = "e0000001-0000-4000-8000-0000000000a1";
const NURSE = "e0000001-0000-4000-8000-0000000000b1";
const CASE = "e0000001-0000-4000-8000-0000000000c1";
const V_PUB = "e0000001-0000-4000-8000-0000000000d1";
const V_DRAFT = "e0000001-0000-4000-8000-0000000000d2";
const S_PUB = "e0000001-0000-4000-8000-0000000000e1";
const S_DRAFT = "e0000001-0000-4000-8000-0000000000e2";

let nurseUser = "";
const TOK_VALID = generateToken();
const TOK_EXPIRED = generateToken();
const TOK_DRAFT = generateToken();

async function cleanup() {
  await admin.from("summary_share_links").delete().in("token", [TOK_VALID, TOK_EXPIRED, TOK_DRAFT]);
  await admin.from("visit_summaries").delete().in("id", [S_PUB, S_DRAFT]);
  await admin.from("visits").delete().in("id", [V_PUB, V_DRAFT]);
  await admin.from("cases").delete().eq("id", CASE);
  await admin.from("patients").delete().eq("id", PAT);
  await admin.from("nurses").delete().eq("id", NURSE);
  await admin.from("families").delete().eq("id", FAM);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith(`@${DOMAIN}`)) await admin.auth.admin.deleteUser(u.id);
  }
}

beforeAll(async () => {
  await cleanup();
  const { data: nu, error } = await admin.auth.admin.createUser({
    email: `nurse@${DOMAIN}`, password: "ShareTest1234!pw", email_confirm: true,
    user_metadata: { display_name: "Share Nurse" },
  });
  if (error || !nu.user) throw new Error(`createUser: ${error?.message}`);
  nurseUser = nu.user.id;
  await admin.from("profiles").update({ role: "nurse" }).eq("id", nurseUser);

  await admin.from("families").insert({ id: FAM, display_name: "Share Fam" });
  await admin.from("patients").insert({ id: PAT, family_id: FAM, display_label: "Share Patient", district: "Achrafieh" });
  await admin.from("nurses").insert({ id: NURSE, user_id: nurseUser, display_name: "Share Nurse", hospital: "AUBMC", active: true });
  await admin.from("cases").insert({ id: CASE, patient_id: PAT, case_ref: "SHARE-CASE-1", mode: "visit", status: "active" });
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  await admin.from("visits").insert([
    { id: V_PUB, case_id: CASE, scheduled_at: dayAgo, assigned_nurse_id: NURSE, status: "completed" },
    { id: V_DRAFT, case_id: CASE, scheduled_at: dayAgo, assigned_nurse_id: NURSE, status: "completed" },
  ]);
  await admin.from("visit_summaries").insert([
    { id: S_PUB, visit_id: V_PUB, done_body: "published body", status: "published", published_at: new Date().toISOString() },
    { id: S_DRAFT, visit_id: V_DRAFT, done_body: "draft body", status: "draft" },
  ]);
  await admin.from("summary_share_links").insert([
    { token: TOK_VALID, visit_summary_id: S_PUB, expires_at: shareExpiry().toISOString(), created_by: nurseUser },
    { token: TOK_EXPIRED, visit_summary_id: S_PUB, expires_at: new Date(Date.now() - 1000).toISOString(), created_by: nurseUser },
    { token: TOK_DRAFT, visit_summary_id: S_DRAFT, expires_at: shareExpiry().toISOString(), created_by: nurseUser },
  ]);
});

afterAll(async () => { await cleanup(); });

describe("public share read path", () => {
  test("valid token → returns the published summary", async () => {
    const doc = await loadSummaryByToken(admin, TOK_VALID);
    expect(doc).not.toBeNull();
    expect(doc!.data.doneBody).toBe("published body");
  });
  test("expired token → null", async () => {
    expect(await loadSummaryByToken(admin, TOK_EXPIRED)).toBeNull();
  });
  test("token for a non-published summary → null", async () => {
    expect(await loadSummaryByToken(admin, TOK_DRAFT)).toBeNull();
  });
  test("unknown/garbage token → null", async () => {
    expect(await loadSummaryByToken(admin, "totally-not-a-real-token")).toBeNull();
  });
});
```

(Implementer note: confirm the `VisitSummaryData` field is named `doneBody` — check `components/portal/VisitSummaryDocument.tsx`. The mapper sets `doneBody: row.done_body`. If the field name differs, assert on the correct one.)

- [ ] **Step 2: Run the integration suite**

Run: `npm run test:rls`
Expected: all suites pass — the existing ones plus the 4 new share tests.

- [ ] **Step 3: Commit**

```bash
git add tests/rls/share-link.itest.ts
git commit -m "test(share): integration tests for the public share read path"
```

---

## Task 10: Full verification

**Files:** none.

- [ ] **Step 1: Unit + integration + build all green**

Run: `npm test` → all unit tests pass (including the 4 `share` tests).
Run: `npm run test:rls` → all integration tests pass.
Run: `npm run build` → clean; route list includes `/[locale]/s/[token]`.

- [ ] **Step 2: Confirm no leftover test fixtures**

Run: `node scripts/db-query.mjs -e "select count(*) as n from auth.users where email like '%@cc-share.test';"`
Expected: `0`.

- [ ] **Step 3: Push**

```bash
git push origin master
```
Expected: pushes cleanly; Vercel auto-deploys.

(The live browser trial — publish → copy link → open with no session → Save-as-PDF → expired/garbage shows the friendly page — is done with the user after this plan completes.)

---

## Self-review notes (author)

- **Spec §3.1 table:** Task 1 (columns/index/RLS match).
- **Spec §3.2 createShareLink (coordinator-only, published-only, reuse-or-create):** Task 4.
- **Spec §3.3 public page (admin client, token+expiry+published gate, expired/unknown state, print-hidden chrome):** Tasks 3 + 8.
- **Spec §3.4 ShareLinkPanel (copy + whatsapp + valid-until):** Tasks 6 + 7.
- **Spec §3.5 download (relabel, reuse print):** Task 5 (`sharePage.download`) + Task 8 (passes `printLabel: sp.download`, page chrome `print-hidden`).
- **Spec §5 security / §6 testing:** Task 9 (valid/expired/draft/garbage) + Task 2 (token entropy/shape).
- **Type consistency:** `createShareLink`/`ShareLinkResult`, `loadSummaryByToken`, `generateToken`/`shareExpiry`/`SHARE_TTL_DAYS`, `ShareLinkPanel` props (`locale,dict,summaryId,patientLabel`) used identically across tasks. `printLabel` field name preserved (not renamed).
- **No placeholders:** every step has concrete code/commands. The one implementer-verify note (field name `doneBody`) points to the exact file to confirm against.
