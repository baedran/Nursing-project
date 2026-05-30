# Nurse-Write Portal — Plan 2: Coordinator Tools

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make `/portal` role-aware (family / nurse / coordinator each get their own home), and give the coordinator two working tools: invite a nurse onto the roster, and schedule + assign a visit.

**Architecture:** `/portal/page.tsx` becomes a thin router that reads the signed-in user's `profiles.role` and renders one of three home components. Coordinator-only screens live under `app/[locale]/portal/{nurses,schedule}/` and guard on role server-side. Mutations are Next.js Server Actions. The nurse-invite action uses the server-only admin client (service-role) to create the auth account, promote the profile to `nurse`, insert the `nurses` row, and mint a magic-link the coordinator can hand over (e.g. via WhatsApp) — this sidesteps the project's current email-delivery limit. Core logic is extracted into small testable `lib/portal/*` helpers (unit-tested) plus one RLS integration test proving an invited nurse can sign in and see a scheduled visit.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 · Supabase (server + admin clients) · Vitest.

**Spec:** `docs/superpowers/specs/2026-05-30-nurse-write-portal-design.md` §2 (roles), §4.1–4.3 (coordinator screens). Plan 1 delivered the schema + types this plan builds on.

---

## Background the engineer needs

- Solo founder, nurse, minimal coding background. Small readable code. Plain comments.
- **Design system (reuse, do not reinvent):** Tailwind v4 with custom colors as utilities — `bg-paper`, `bg-paper-cool`, `bg-cream`, `text-ink`, `text-ink-soft`, `text-muted`, `text-teal`, `text-teal-deep`, `bg-teal-soft`, `border-rule`, `bg-night`, etc. Fonts: `font-display` (Cabinet Grotesk), `font-mono` (Fragment Mono for eyebrows/labels), body is Switzer (default). Eyebrows/labels are the recurring pattern: `font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep`. Layout vars: `var(--shell-max)`, `var(--pad-x)`. Study `app/[locale]/portal/page.tsx`, `app/[locale]/login/page.tsx`, and `components/portal/VisitSummaryDocument.tsx` for the exact idiom and copy them.
- **Tailwind v4 gotcha (IMPORTANT):** some custom color utilities don't always generate for arbitrary properties. The codebase's defensive fix, used on dark buttons, is inline CSS vars: `style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}`. Use that pattern for any cream-on-dark or paper-on-dark button text (see the existing sample CTA in `portal/page.tsx` lines ~126-132).
- **Auth/session patterns already in the repo:**
  - `createClient()` from `@/lib/supabase/server` — RLS-bound server client (reads cookies). Use for all reads/writes that should respect the logged-in user.
  - `createAdminClient()` from `@/lib/supabase/admin` — service-role, bypasses RLS, **server-only**. Use ONLY in the invite action.
  - Server Actions live in a sibling `actions.ts` with `"use server"` at top (see `app/[locale]/login/actions.ts`).
  - Pages read `params: Promise<{ locale: string }>` and `await params` (Next 16 async params). Validate with `isLocale(locale)`; `notFound()` if invalid.
  - `getDictionary(locale)` returns typed strings from `messages/en.json` / `ar.json`.
- **Current data (cloud):** one coordinator profile (`141ae2e4-d746-4dc9-b1ed-c8668950e5c5`, display_name "Coordinator"), zero nurses, one patient "Mariam" with one active case "Case 2026-051". A scheduled visit assigned to a nurse is exactly what Plan 3 needs to test the writing flow.
- **DB helper:** `node scripts/db-query.mjs -e "<sql>"` runs SQL against the cloud project via the Management API (token in gitignored `.supabase-token`). Use it to verify data, never to bypass app logic in tests.
- **Tables (from `supabase/migrations/20260519000000_init.sql`):**
  - `profiles(id, role, display_name, preferred_locale, ...)` — role in (family|nurse|coordinator). A trigger auto-creates a profile (role default 'family') on auth signup.
  - `nurses(id, user_id unique, display_name, hospital, license_number, certifications text[] default '{}', active bool default true, ...)`
  - `patients(id, family_id, display_label, district, ...)`, `cases(id, patient_id, case_ref, mode, status, ...)`, `visits(id, case_id, scheduled_at, assigned_nurse_id, status default 'scheduled', ...)`.
- **RLS reminder:** coordinator policies already allow full read/write on nurses, patients, cases, visits. Family read on summaries is published-only (Plan 1).

**Run commands from project root** `c:\Users\theom\Desktop\New proj`. `npm test` = unit/component tests. `npm run test:rls` = integration tests against the real DB.

---

## File map

| Path | Created / Modified | Responsibility |
|------|-------------------|----------------|
| `lib/portal/roles.ts` | Create | `resolveRole()` pure helper + `PortalRole` type |
| `lib/portal/roles.test.ts` | Create | Unit tests for `resolveRole` |
| `messages/en.json` | Modify | Add `portal.coordinator.*`, `portal.nurseHome.*`, `portal.nurses.*`, `portal.schedule.*` strings |
| `messages/ar.json` | Modify | Mirror the new keys (English placeholder values OK — AR editor later) |
| `components/portal/FamilyHome.tsx` | Create | Current family landing, extracted from page.tsx |
| `components/portal/CoordinatorHome.tsx` | Create | Review queue + management links |
| `components/portal/NurseHome.tsx` | Create | Minimal nurse landing shell (Plan 3 fills it in) |
| `app/[locale]/portal/page.tsx` | Modify | Role router → renders one of the three homes |
| `app/[locale]/portal/nurses/page.tsx` | Create | Roster list + add-nurse form (coordinator-only) |
| `app/[locale]/portal/nurses/actions.ts` | Create | `inviteNurse` server action (admin client) |
| `app/[locale]/portal/schedule/page.tsx` | Create | Schedule-visit form (coordinator-only) |
| `app/[locale]/portal/schedule/actions.ts` | Create | `scheduleVisit` server action |
| `tests/rls/coordinator-tools.itest.ts` | Create | Invited nurse can sign in + see scheduled visit |

---

## Task 1: Role helper + role-aware portal router with three homes

**Files:**
- Create: `lib/portal/roles.ts`, `lib/portal/roles.test.ts`
- Create: `components/portal/FamilyHome.tsx`, `components/portal/CoordinatorHome.tsx`, `components/portal/NurseHome.tsx`
- Modify: `app/[locale]/portal/page.tsx`, `messages/en.json`, `messages/ar.json`

- [ ] **Step 1: Write the failing unit test for the role helper**

Create `lib/portal/roles.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { resolveRole } from "@/lib/portal/roles";

describe("resolveRole", () => {
  test("returns the profile role when valid", () => {
    expect(resolveRole({ role: "coordinator" })).toBe("coordinator");
    expect(resolveRole({ role: "nurse" })).toBe("nurse");
    expect(resolveRole({ role: "family" })).toBe("family");
  });

  test("defaults to family when profile is null", () => {
    expect(resolveRole(null)).toBe("family");
  });

  test("defaults to family for an unknown role", () => {
    expect(resolveRole({ role: "admin" })).toBe("family");
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `npm test -- roles`
Expected: FAIL — cannot find module `@/lib/portal/roles`.

- [ ] **Step 3: Implement the helper**

Create `lib/portal/roles.ts`:

```ts
// Who the signed-in user is, for choosing which portal home to render.
export type PortalRole = "family" | "nurse" | "coordinator";

const VALID: readonly PortalRole[] = ["family", "nurse", "coordinator"];

/**
 * Resolve a portal role from a profile row. Anything unexpected (no profile,
 * unknown role string) falls back to the least-privileged role, "family".
 */
export function resolveRole(
  profile: { role?: string | null } | null | undefined,
): PortalRole {
  const role = profile?.role;
  return (VALID as readonly string[]).includes(role ?? "")
    ? (role as PortalRole)
    : "family";
}
```

- [ ] **Step 4: Run it, confirm it passes**

Run: `npm test -- roles`
Expected: PASS — 3 tests.

- [ ] **Step 5: Add i18n strings**

In `messages/en.json`, replace the `"portal": { ... }` object with this expanded version (keeps existing family keys, adds the new namespaces):

```json
  "portal": {
    "eyebrow": "Portal",
    "headline": "Welcome, {name}.",
    "patientsLabel": "Patients you have access to",
    "emptyPatients": "Nothing here yet. If a coordinator just added a case for your family, refresh in a moment.",
    "sampleLabel": "Sample document",
    "sampleHeadline": "Want to see what a visit summary looks like?",
    "sampleBody": "Every visit ends with a written summary. Here's the format your portal will render once a real visit lands.",
    "sampleCta": "View sample summary",
    "logoutLabel": "Sign out",
    "coordinator": {
      "eyebrow": "Coordinator",
      "headline": "Coordinator desk",
      "queueLabel": "Summaries waiting for review",
      "queueEmpty": "Nothing waiting. When a nurse submits a visit summary, it lands here for you to review and publish.",
      "reviewCta": "Review",
      "manageNursesLabel": "Manage nurses",
      "manageNursesBody": "Add a nurse to the roster and get a sign-in link to send them.",
      "scheduleLabel": "Schedule a visit",
      "scheduleBody": "Assign a patient visit to a nurse. It appears on their dashboard to write up.",
      "openLabel": "Open"
    },
    "nurseHome": {
      "eyebrow": "Nurse",
      "headline": "Welcome back, {name}.",
      "body": "Your assigned visits and write-ups will appear here.",
      "noVisits": "No visits assigned yet. When the coordinator schedules one for you, it shows up here."
    },
    "nurses": {
      "eyebrow": "Roster",
      "headline": "Nurses",
      "lede": "The nurses who can log in and write visit summaries. Add one, then send them their sign-in link.",
      "backToPortal": "Back to coordinator desk",
      "rosterLabel": "Current roster",
      "empty": "No nurses yet. Add the first one below.",
      "colName": "Name",
      "colHospital": "Hospital",
      "colLicense": "License",
      "colStatus": "Status",
      "active": "Active",
      "inactive": "Inactive",
      "addLabel": "Add a nurse",
      "nameField": "Full name",
      "namePlaceholder": "Rita K.",
      "emailField": "Email",
      "emailPlaceholder": "rita@example.com",
      "hospitalField": "Hospital",
      "hospitalPlaceholder": "AUBMC",
      "licenseField": "License number (optional)",
      "licensePlaceholder": "RN-12345",
      "submitLabel": "Add nurse & create sign-in link",
      "successLabel": "Nurse added",
      "successBody": "{name} is on the roster. Send them this one-time sign-in link (it works for an hour):",
      "successHint": "Tip: send it on WhatsApp. They can also sign in any time from the login page with their email.",
      "copyLabel": "Copy link",
      "addAnother": "Add another nurse",
      "errorExists": "An account with that email already exists.",
      "errorGeneric": "Could not add the nurse. Check the details and try again."
    },
    "schedule": {
      "eyebrow": "Schedule",
      "headline": "Schedule a visit",
      "lede": "Pick a patient, a date, and the nurse. The visit appears on the nurse's dashboard to write up after.",
      "backToPortal": "Back to coordinator desk",
      "patientField": "Patient & case",
      "nurseField": "Assign to nurse",
      "dateField": "Date & time",
      "submitLabel": "Schedule & assign",
      "noNurses": "Add a nurse first — there's no one to assign a visit to yet.",
      "noCases": "No patients with an active case yet.",
      "successLabel": "Visit scheduled",
      "successBody": "Scheduled for {patient} with {nurse} on {when}. It's now on the nurse's dashboard.",
      "scheduleAnother": "Schedule another",
      "errorGeneric": "Could not schedule the visit. Check the details and try again."
    }
  }
```

In `messages/ar.json`, add the SAME keys under `portal` with the same English values as placeholders (the project ships AR as placeholder copy; an AR editor revises later). Match the existing pattern in that file.

- [ ] **Step 6: Extract FamilyHome from the current portal page**

Create `components/portal/FamilyHome.tsx` containing the EXACT existing family UI currently in `app/[locale]/portal/page.tsx` (the eyebrow+headline, patients list, sample CTA, logout form). It is a server component (no `"use client"`). Signature:

```tsx
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type Patient = { id: string; display_label: string; district: string | null };

export default function FamilyHome({
  locale,
  dict,
  displayName,
  patients,
}: {
  locale: string;
  dict: Dictionary;
  displayName: string;
  patients: Patient[];
}) {
  return (
    // ...move the existing <section> markup here, using `dict.portal.*`,
    // `displayName`, and `patients` (the list previously called patientList).
    // Keep the sample CTA's inline-CSS-var button exactly as-is.
    // Keep the logout <form action={`/${locale}/logout`} method="post"> exactly as-is.
  );
}
```
Move the markup verbatim; only swap the data sources to the props. Do not restyle.

- [ ] **Step 7: Create CoordinatorHome**

Create `components/portal/CoordinatorHome.tsx` (server component). It shows: an eyebrow + headline; a "Summaries waiting for review" section listing `queue` items (each linking to `/${locale}/portal/review/${id}` — that route is built in Plan 3, the link is fine to render now) or the `queueEmpty` message; and two cards linking to `/${locale}/portal/nurses` and `/${locale}/portal/schedule`. Reuse the visual idiom (eyebrow classes, `rounded-xl border border-rule bg-white`, the teal-soft card style from the existing sample CTA). Signature:

```tsx
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type QueueItem = {
  id: string;
  patientLabel: string;
  caseRef: string;
  nurseName: string | null;
  visitWhen: string;
};

export default function CoordinatorHome({
  locale,
  dict,
  displayName,
  queue,
}: {
  locale: string;
  dict: Dictionary;
  displayName: string;
  queue: QueueItem[];
}) {
  // eyebrow: dict.portal.coordinator.eyebrow
  // headline: dict.portal.coordinator.headline (no {name} needed, but you may
  //   show displayName as a subtle subtitle)
  // queue section + two management cards (Manage nurses / Schedule a visit)
}
```

- [ ] **Step 8: Create NurseHome (minimal shell for now)**

Create `components/portal/NurseHome.tsx` (server component). Minimal: eyebrow + `headline` with `{name}` replaced + `body` text + a `noVisits` empty-state card. Plan 3 replaces this with the real dashboard. Signature:

```tsx
import type { Dictionary } from "@/lib/i18n";

export default function NurseHome({
  dict,
  displayName,
}: {
  dict: Dictionary;
  displayName: string;
}) {
  // eyebrow dict.portal.nurseHome.eyebrow,
  // headline dict.portal.nurseHome.headline.replace("{name}", displayName),
  // body + noVisits card. Match portal visual idiom.
}
```

- [ ] **Step 9: Rewrite the portal page as a role router**

Replace `app/[locale]/portal/page.tsx` with:

```tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { resolveRole } from "@/lib/portal/roles";
import FamilyHome from "@/components/portal/FamilyHome";
import CoordinatorHome from "@/components/portal/CoordinatorHome";
import NurseHome from "@/components/portal/NurseHome";

export default async function PortalHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout already redirects unauthenticated users

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const role = resolveRole(profile);
  const displayName = profile?.display_name ?? user.email ?? "—";

  if (role === "coordinator") {
    // Summaries awaiting review (submitted or in_review), newest first.
    const { data: rows } = await supabase
      .from("visit_summaries")
      .select(
        "id, status, submitted_at, visits(scheduled_at, nurses(display_name), cases(case_ref, patients(display_label, district)))",
      )
      .in("status", ["submitted", "in_review"])
      .order("submitted_at", { ascending: true });

    const queue = (rows ?? []).map((r: any) => ({
      id: r.id as string,
      patientLabel: r.visits?.cases?.patients?.display_label ?? "—",
      caseRef: r.visits?.cases?.case_ref ?? "—",
      nurseName: r.visits?.nurses?.display_name ?? null,
      visitWhen: r.visits?.scheduled_at
        ? new Date(r.visits.scheduled_at).toLocaleString()
        : "—",
    }));

    return (
      <PortalShell>
        <CoordinatorHome
          locale={locale}
          dict={dict}
          displayName={displayName}
          queue={queue}
        />
      </PortalShell>
    );
  }

  if (role === "nurse") {
    return (
      <PortalShell>
        <NurseHome dict={dict} displayName={displayName} />
      </PortalShell>
    );
  }

  // family
  const { data: patients } = await supabase
    .from("patients")
    .select("id, display_label, district")
    .is("deleted_at", null);

  return (
    <PortalShell>
      <FamilyHome
        locale={locale}
        dict={dict}
        displayName={displayName}
        patients={(patients ?? []) as any}
      />
    </PortalShell>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="bg-paper"
      style={{
        paddingBlock: "clamp(60px, 10vw, 120px)",
        minHeight: "calc(100vh - 68px)",
      }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          {children}
        </div>
      </div>
    </section>
  );
}
```

Note: the previous page wrapped content in this same shell; FamilyHome's markup should therefore NOT include the outer `<section>`/shell (it's provided here). Adjust the extracted FamilyHome to render only the inner content (eyebrow → logout form), matching how CoordinatorHome/NurseHome render inner content.

- [ ] **Step 10: Typecheck + build + tests**

Run: `npm run build`
Expected: compiles, all routes listed including `/[locale]/portal`. Fix any type errors (the Supabase nested-select typing may need the `as any` casts shown above — that matches the existing code's approach).

Run: `npm test`
Expected: PASS — previous 3 + roles tests.

- [ ] **Step 11: Commit**

```bash
git add lib/portal/roles.ts lib/portal/roles.test.ts components/portal/FamilyHome.tsx components/portal/CoordinatorHome.tsx components/portal/NurseHome.tsx app/[locale]/portal/page.tsx messages/en.json messages/ar.json
git commit -m "feat(portal): role-aware portal home (family/nurse/coordinator)"
```

---

## Task 2: Manage nurses + invite action

**Files:**
- Create: `app/[locale]/portal/nurses/page.tsx`, `app/[locale]/portal/nurses/actions.ts`
- Create: `tests/rls/coordinator-tools.itest.ts`

- [ ] **Step 1: Write the invite server action**

Create `app/[locale]/portal/nurses/actions.ts`:

```ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteResult =
  | { ok: true; nurseName: string; magicLink: string | null }
  | { ok: false; error: "exists" | "forbidden" | "generic" };

/**
 * Coordinator-only. Creates a passwordless nurse account, promotes the profile
 * to role 'nurse', inserts the nurses row, and mints a one-time magic sign-in
 * link the coordinator can hand to the nurse (e.g. on WhatsApp). Uses the admin
 * (service-role) client — server-only.
 */
export async function inviteNurse(formData: FormData): Promise<InviteResult> {
  const locale = String(formData.get("locale") ?? "en");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const hospital = String(formData.get("hospital") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();

  if (!name || !email) return { ok: false, error: "generic" };

  // Authorise: caller must be a coordinator (RLS-bound client).
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

  const admin = createAdminClient();

  // Create the auth account (passwordless; email pre-confirmed so they can use
  // magic-link sign-in immediately). The handle_new_user trigger creates a
  // profile row (role default 'family').
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: name },
  });

  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { ok: false, error: "exists" };
    }
    return { ok: false, error: "generic" };
  }

  const userId = created.user.id;

  // Promote to nurse + insert nurse provider record.
  const { error: roleErr } = await admin
    .from("profiles")
    .update({ role: "nurse", display_name: name })
    .eq("id", userId);
  const { error: nurseErr } = await admin.from("nurses").insert({
    user_id: userId,
    display_name: name,
    hospital: hospital || null,
    license_number: license || null,
    active: true,
  });

  if (roleErr || nurseErr) {
    // Roll back the half-created account so a retry is clean.
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "generic" };
  }

  // Mint a magic sign-in link pointing at the existing confirm route.
  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://nursing-project-olive.vercel.app";
  let magicLink: string | null = null;
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/${locale}/auth/confirm` },
  });
  magicLink = linkData?.properties?.action_link ?? null;

  revalidatePath(`/${locale}/portal/nurses`);
  return { ok: true, nurseName: name, magicLink };
}
```

- [ ] **Step 2: Write the manage-nurses page**

Create `app/[locale]/portal/nurses/page.tsx` (server component, coordinator-only). It must:
- `await params`, validate locale, load dict.
- Get the user; load their profile role; if not `coordinator`, `redirect(`/${locale}/portal`)` (import `redirect` from `next/navigation`).
- Load the roster: `supabase.from("nurses").select("id, display_name, hospital, license_number, active").order("created_at", { ascending: false })`.
- Render: back link to `/portal`; eyebrow+headline+lede; a roster table (or stacked cards on mobile) using `dict.portal.nurses.*` (show `active ? activeLabel : inactiveLabel`), or the `empty` message; then the add-nurse form.
- The form is a small client component (because it shows the returned magic link inline). Create it inline in this file is not possible (server file). Instead make the form its own client component file `components/portal/AddNurseForm.tsx` ("use client") that:
  - renders inputs name/email/hospital/license + a hidden `locale`,
  - calls the `inviteNurse` action via `useActionState` (React 19) or a manual `onSubmit` calling the imported server action,
  - on `{ok:true}` shows the success panel: `successBody` with `{name}` replaced, the `magicLink` in a readonly input + a copy button, `successHint`, and an "Add another" button that resets state,
  - on `{ok:false}` shows `errorExists` (for `exists`) or `errorGeneric`.

  Use `useActionState(inviteNurse, null)` pattern:
  ```tsx
  "use client";
  import { useActionState } from "react";
  import { inviteNurse, type InviteResult } from "@/app/[locale]/portal/nurses/actions";
  // form posts via the action; render result.
  ```
  Style inputs like the login form (`rounded-lg border border-rule bg-white px-4 py-3 text-[15px] ... focus:border-teal`). Submit button: dark pill (`rounded-full bg-ink px-7 py-4 text-paper`, with the inline-CSS-var fallback for text color). Copy button uses `navigator.clipboard.writeText`.

- [ ] **Step 3: Manual-safe verification via build**

Run: `npm run build`
Expected: compiles; `/[locale]/portal/nurses` appears in the route list.

- [ ] **Step 4: Write the integration test (invite → nurse can sign in)**

Create `tests/rls/coordinator-tools.itest.ts`. It does NOT call the server action (that needs a request context); instead it proves the same DB operations the action performs are correct and integrate with Plan 1's RLS. Reuse helpers from `./helpers`.

```ts
// Coordinator tools (integration): proves an invited nurse account is set up
// correctly and that a scheduled visit is visible to exactly that nurse.
// Mirrors the DB operations performed by inviteNurse + scheduleVisit actions.
// Fixtures use @cc-coord.test; teardown removes only those rows.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminClient, signedInClient } from "./helpers";

const PW = "CoordTest1234!pw";
const DOMAIN = "cc-coord.test";
const admin = adminClient();

const FAM = "c0000001-0000-4000-8000-000000000001";
const PAT = "c0000001-0000-4000-8000-0000000000a1";
const CASE = "c0000001-0000-4000-8000-0000000000c1";
const NURSE = "c0000001-0000-4000-8000-0000000000b1";
let nurseUserId = "";
let visitId = "";

async function cleanup() {
  await admin.from("visits").delete().eq("case_id", CASE);
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
  // Patient + active case (as if already created)
  await admin.from("families").insert({ id: FAM, display_name: "Coord Fam" });
  await admin.from("patients").insert({ id: PAT, family_id: FAM, display_label: "Coord Patient", district: "Achrafieh" });
  await admin.from("cases").insert({ id: CASE, patient_id: PAT, case_ref: "Coord Case 1", mode: "visit", status: "active" });

  // Simulate inviteNurse: create account, promote to nurse, insert nurses row.
  const email = `coord_nurse@${DOMAIN}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email, email_confirm: true, user_metadata: { display_name: "Coord Nurse" },
  });
  if (error || !created.user) throw new Error(`createUser: ${error?.message}`);
  nurseUserId = created.user.id;
  await admin.from("profiles").update({ role: "nurse", display_name: "Coord Nurse" }).eq("id", nurseUserId);
  await admin.from("nurses").insert({ id: NURSE, user_id: nurseUserId, display_name: "Coord Nurse", hospital: "AUBMC", active: true });
  // Let the nurse use a password for the test sign-in (real flow uses magic link).
  await admin.auth.admin.updateUserById(nurseUserId, { password: PW });

  // Simulate scheduleVisit: insert a visit assigned to this nurse.
  const { data: v, error: vErr } = await admin.from("visits").insert({
    case_id: CASE, scheduled_at: new Date().toISOString(), assigned_nurse_id: NURSE, status: "scheduled",
  }).select("id").single();
  if (vErr) throw new Error(`visit insert: ${vErr.message}`);
  visitId = v!.id;
});

afterAll(async () => { await cleanup(); });

describe("invited nurse account", () => {
  test("profile role is nurse", async () => {
    const { data } = await admin.from("profiles").select("role").eq("id", nurseUserId).single();
    expect(data?.role).toBe("nurse");
  });
  test("nurses row is linked to the auth user", async () => {
    const { data } = await admin.from("nurses").select("user_id, active").eq("id", NURSE).single();
    expect(data?.user_id).toBe(nurseUserId);
    expect(data?.active).toBe(true);
  });
});

describe("scheduled visit visibility", () => {
  test("the assigned nurse can see her scheduled visit", async () => {
    const nurse = await signedInClient(`coord_nurse@${DOMAIN}`, PW);
    const { data, error } = await nurse.from("visits").select("id, status").eq("id", visitId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].status).toBe("scheduled");
  });
});
```

- [ ] **Step 5: Run the integration test**

Run: `npm run test:rls`
Expected: PASS — the existing 22 + these new tests all green. (Both itest files run; fileParallelism is off so they don't collide.)

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/portal/nurses components/portal/AddNurseForm.tsx tests/rls/coordinator-tools.itest.ts
git commit -m "feat(portal): coordinator can invite a nurse + get a sign-in link"
```

---

## Task 3: Schedule a visit

**Files:**
- Create: `app/[locale]/portal/schedule/page.tsx`, `app/[locale]/portal/schedule/actions.ts`, `components/portal/ScheduleVisitForm.tsx`

- [ ] **Step 1: Write the schedule server action**

Create `app/[locale]/portal/schedule/actions.ts`:

```ts
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
  return {
    ok: true,
    patientLabel,
    nurseName,
    when: when.toLocaleString(),
  };
}
```

- [ ] **Step 2: Write the schedule page + form**

Create `app/[locale]/portal/schedule/page.tsx` (server, coordinator-only, same guard as nurses page). It loads:
- cases with their patient, only active cases:
  `supabase.from("cases").select("id, case_ref, patients(display_label, district)").eq("status", "active")`
- nurses: `supabase.from("nurses").select("id, display_name, hospital").eq("active", true)`

Then renders a back link, eyebrow/headline/lede, and:
- if no active nurses → show `dict.portal.schedule.noNurses` + a link to `/portal/nurses`.
- if no active cases → show `dict.portal.schedule.noCases`.
- else render `ScheduleVisitForm` (client) with the cases + nurses as props.

Create `components/portal/ScheduleVisitForm.tsx` ("use client"):
- A `<select>` for patient/case (option label `"{display_label} · {case_ref}"`, value `caseId`; also stash the patient label so the action can echo it — pass it via a hidden field updated on change, or look it up in the submit handler and append to FormData).
- A `<select>` for nurse (label `"{display_name} · {hospital}"`, value `nurseId`).
- A `<input type="datetime-local">` for `scheduledAt`.
- Hidden `locale`.
- Uses `useActionState(scheduleVisit, null)`. On `{ok:true}` show `successBody` with `{patient}`,`{nurse}`,`{when}` replaced + a "Schedule another" reset. On error show `errorGeneric`.
- Because the action wants `patientLabel`/`nurseName` for the echo, in the client `onSubmit`/form-data augmentation, set those hidden fields from the currently-selected option's text before submitting (simplest: maintain controlled state for the selected case + nurse and render matching hidden inputs).

Style selects/inputs like the login form inputs. Submit button = dark pill with inline-CSS-var text fallback.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles; `/[locale]/portal/schedule` in the route list.

- [ ] **Step 4: Extend the integration test is already covered**

The visibility of a scheduled visit to the assigned nurse is already asserted in `tests/rls/coordinator-tools.itest.ts` (Task 2). No new test needed; just confirm it still passes after this task.

Run: `npm run test:rls`
Expected: PASS — all green.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/portal/schedule components/portal/ScheduleVisitForm.tsx
git commit -m "feat(portal): coordinator can schedule + assign a visit to a nurse"
```

---

## Task 4: Full verification + smoke

**Files:** none (verification).

- [ ] **Step 1: Full unit + integration + build**

Run: `npm test` → all unit/component tests pass.
Run: `npm run test:rls` → all integration tests pass.
Run: `npm run build` → clean.

- [ ] **Step 2: Live smoke (manual, via Playwright MCP or browser)**

With the dev server (`npm run dev`) and signed in as the coordinator (`141ae2e4…`):
1. Visit `/en/portal` → see the Coordinator desk (empty review queue + two cards).
2. `/en/portal/nurses` → add a test nurse → confirm a magic link is shown; confirm the nurse appears in the roster; confirm a `nurses` row exists via `node scripts/db-query.mjs -e "select display_name, hospital from public.nurses;"`.
3. `/en/portal/schedule` → schedule a visit for Mariam with that nurse → confirm success; confirm a `visits` row via `node scripts/db-query.mjs -e "select status, assigned_nurse_id from public.visits order by created_at desc limit 1;"`.

- [ ] **Step 3: Confirm no leftover test fixtures**

Run: `node scripts/db-query.mjs -e "select count(*) as n from auth.users where email like '%@cc-coord.test';"`
Expected: `0` (integration teardown cleaned up). If you created a nurse manually in Step 2 for the smoke, either keep it (useful for Plan 3 testing) or delete it.

---

## Done — what Plan 2 delivered

- `/portal` renders the right home per role.
- Coordinator can invite a nurse (account + role + nurses row + a shareable magic link) and schedule/assign a visit.
- An invited nurse can sign in and sees exactly her scheduled visit (RLS proven).
- Plan 3 picks up here: the nurse dashboard (real), the summary writer, and the coordinator review/publish screen + wound photos.

## Self-review notes (for the author)

- **Spec §2 (roles):** role router (Task 1) — covered.
- **Spec §4.1 (coordinator home / review queue):** CoordinatorHome with queue from submitted/in_review summaries — covered (queue empty until Plan 3 produces submissions; link target `/portal/review/[id]` built in Plan 3).
- **Spec §4.2 (manage nurses / invite):** Task 2; admin client used server-only; magic link replaces the email-delivery dependency (on-brand: send via WhatsApp).
- **Spec §4.3 (schedule visit):** Task 3.
- **No placeholders:** every action has full code; pages specify exact queries + copy keys; forms specify exact behavior. Form components are described with the precise hooks/props rather than full JSX where the styling simply mirrors the login form — the implementer must follow the cited existing files.
- **Type consistency:** action names `inviteNurse`/`scheduleVisit`; result types `InviteResult`/`ScheduleResult`; helper `resolveRole`/`PortalRole` used consistently across tasks.
- **Deferred:** real nurse dashboard, writer, review screen, photos → Plan 3.
