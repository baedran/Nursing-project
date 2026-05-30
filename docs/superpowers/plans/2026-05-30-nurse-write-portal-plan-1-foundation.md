# Nurse-Write Portal — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an automated test harness (local Supabase + Vitest + pgTAP) and ship the database migration that adds the visit-summary lifecycle, an append-only audit log, and tightened Row-Level Security — with SQL tests that prove the access rules hold.

**Architecture:** Local Supabase (via Docker + the Supabase CLI) is the test sandbox: `supabase db reset` re-applies every migration from scratch, then `supabase test db` runs pgTAP SQL tests that impersonate each role and assert who can see/edit what. The cloud project remains the real dev/prod database; the same migration is applied there at the end. State transitions (submit / open-review / publish / send-back) run through `SECURITY DEFINER` Postgres functions so the state machine and audit log are enforced in one place and cannot be bypassed by the UI. Vitest + React Testing Library are installed now (with smoke tests) so Plans 2 and 3 can test React components.

**Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + Auth + Storage) · Supabase CLI · Docker Desktop · pgTAP (SQL tests) · Vitest + @testing-library/react (component tests).

**Spec:** `docs/superpowers/specs/2026-05-30-nurse-write-portal-design.md` (§3 lifecycle, §6 data/schema, §8 compliance).

---

## Background the engineer needs

This is a solo founder's project. The founder is a nurse with minimal coding background — keep changes small and readable. A few project facts:

- **There is no test framework yet.** This plan adds the first one. Until now the gate was `npm run build` + manual browser QA.
- **The database already exists** in two forms: a single migration `supabase/migrations/20260519000000_init.sql` (tables, RLS, helper functions, the `wound-photos` storage bucket) and a live cloud project (ref `mudjjpnxjjapdcxhhngj`). The migration in this plan extends both.
- **RLS = Row-Level Security**: Postgres rules that decide, per row, which logged-in user may read/write it. The cloud project already has RLS on every table. We are *tightening* two read rules and adding rules for one new table.
- **`auth.uid()`** inside a policy returns the logged-in user's UUID. Helper functions `public.is_coordinator()`, `public.is_family_member(family_id)`, and `public.is_assigned_nurse(visit_id)` already exist (see `init.sql` lines 186–228) and are reused here.
- **pgTAP** is a testing framework that runs *inside* Postgres: a test file is one transaction that calls `plan(N)`, runs `N` assertions (`is`, `ok`, `lives_ok`, `throws_ok`), then `finish()` and rolls back. `supabase test db` runs every file in `supabase/tests/`.
- **Why `SECURITY DEFINER` functions for transitions:** an RLS policy cannot compare the old row to the new row, so it cannot say "a nurse may change status from draft to submitted but not to published." We solve this by making content edits RLS-restricted (a nurse update may only ever *leave* a row in `draft`/`changes_requested`) and routing every *status change* through a definer function that checks the caller's role and the current status, then writes the audit event in the same step.

**Run all commands from the project root** `c:\Users\theom\Desktop\New proj`. Commands are written with `npx` so they work in both PowerShell and bash. npm scripts run in `cmd` on Windows, so `>` redirection inside a script is safe.

---

## File map (created/modified in this plan)

| Path | Created / Modified | Responsibility |
|------|-------------------|----------------|
| `package.json` | Modified | Add `supabase`, `vitest`, RTL deps; add `test`, `db:*` scripts |
| `supabase/config.toml` | Created (by `supabase init`) then Modified | Local stack config; disable auto-seed |
| `.gitignore` | Modified (by `supabase init`) | Ignore local Supabase temp dirs |
| `vitest.config.ts` | Created | Vitest + jsdom + `@/*` alias |
| `vitest.setup.ts` | Created | Loads `@testing-library/jest-dom` matchers |
| `lib/i18n.test.ts` | Created | Smoke test for the unit-test stack |
| `components/portal/PrintButton.test.tsx` | Created | Smoke test for the React/RTL stack |
| `supabase/migrations/<ts>_enable_pgtap.sql` | Created (via CLI) | Enables the pgTAP extension |
| `supabase/migrations/<ts>_nurse_write.sql` | Created (via CLI) | Lifecycle columns, audit table, transition functions, RLS changes |
| `supabase/tests/nurse_write_rls.test.sql` | Created | pgTAP proof of the access rules |
| `lib/supabase/types.ts` | Modified (regenerated) | Real DB types replacing the placeholder |

---

## Task 1: Install Docker Desktop and verify it runs

**Files:** none (local machine setup).

Docker Desktop is what lets a full copy of the database run on the laptop. This is a one-time GUI install the founder does; the rest of the plan assumes `docker` works.

- [ ] **Step 1: Install Docker Desktop**

Download Docker Desktop for Windows from https://www.docker.com/products/docker-desktop/ and run the installer with default options. When it finishes, launch Docker Desktop and wait until the whale icon in the system tray says "Docker Desktop is running." (If prompted to enable WSL 2, accept — it's the recommended backend.)

- [ ] **Step 2: Verify Docker is available**

Run: `docker --version`
Expected: a version line, e.g. `Docker version 27.x.x, build ...`

- [ ] **Step 3: Verify the Docker engine is actually running**

Run: `docker ps`
Expected: a header row `CONTAINER ID   IMAGE   ...` with no error. If you instead see `error during connect` / `cannot connect to the Docker daemon`, Docker Desktop is not started yet — open it and wait for "running," then re-run.

No commit (nothing changed in the repo).

---

## Task 2: Add the Supabase CLI and initialise the local project

**Files:**
- Modify: `package.json` (add dev dependency + scripts)
- Create: `supabase/config.toml` (via `supabase init`)
- Modify: `supabase/config.toml` (disable auto-seed)
- Modify: `.gitignore` (by `supabase init`)

- [ ] **Step 1: Install the Supabase CLI as a dev dependency**

Run: `npm install --save-dev supabase`
Expected: `package.json` `devDependencies` now lists `supabase`. (Installing it as a dependency — rather than globally — means anyone who clones the repo gets the same CLI version.)

- [ ] **Step 2: Initialise the Supabase local project**

Run: `npx supabase init`

If it asks "Generate VS Code settings for Deno? [y/N]" answer `N`. If it asks about IntelliJ settings, answer `N`.
Expected: creates `supabase/config.toml`. It will **not** delete the existing `supabase/migrations/` files or `supabase/seed.sql`. It also adds Supabase entries to `.gitignore` (e.g. `supabase/.branches`, `supabase/.temp`).

If it prints `supabase/config.toml already exists`, that's fine — skip to Step 3.

- [ ] **Step 3: Disable auto-seeding for the local stack**

The repo's `supabase/seed.sql` is a *production* helper that contains a placeholder UUID (`YOUR_AUTH_USER_ID_HERE`); if the local stack tried to run it on reset, it would error. Our pgTAP tests create their own data, so turn auto-seed off.

Open `supabase/config.toml`, find the `[db.seed]` section, and set `enabled = false`:

```toml
[db.seed]
enabled = false
```

(If there is no `[db.seed]` section, add the two lines above at the end of the file. Leave every other setting at its default.)

- [ ] **Step 4: Add npm scripts**

In `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:db": "supabase test db",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:types": "supabase gen types typescript --local > lib/supabase/types.ts"
  },
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json supabase/config.toml .gitignore
git commit -m "chore(test): add Supabase CLI + local config, disable local auto-seed"
```

---

## Task 3: Start the local stack and confirm the existing schema applies

**Files:** none (verification only).

- [ ] **Step 1: Start local Supabase**

Run: `npm run db:start`
(First run downloads several Docker images — this can take 5–10 minutes. Subsequent runs are fast.)
Expected: when it finishes it prints a block of local URLs and keys, ending with something like:
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
...
```

- [ ] **Step 2: Apply all migrations to the fresh local database**

Run: `npm run db:reset`
Expected: ends with `Applying migration 20260519000000_init.sql...` (and any others) then `Finished supabase db reset on ...`. No error. (If it complains about `seed.sql`, re-check Task 2 Step 3 — auto-seed must be disabled.)

- [ ] **Step 3: Confirm the baseline tables exist locally**

Open Studio at http://127.0.0.1:54323 in the browser, click **Table Editor**, and confirm the tables from `init.sql` are present: `profiles, families, family_memberships, patients, nurses, cases, visits, visit_summaries, wound_photos`.

Expected: all nine tables listed. (This proves the existing migration runs cleanly on a clean database — our new migration builds on it.)

No commit (verification only).

---

## Task 4: Install and configure Vitest + React Testing Library, with smoke tests

**Files:**
- Modify: `package.json` (dev deps — installed via command)
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `lib/i18n.test.ts`
- Create: `components/portal/PrintButton.test.tsx`

This proves the component-test stack works *now*, so Plans 2 and 3 can write component tests with confidence.

- [ ] **Step 1: Install the testing libraries**

Run:
```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: all packages added to `devDependencies`.

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // Supabase SQL tests and build output are not Vitest's job.
    exclude: ["node_modules", ".next", "supabase/**", ".superpowers/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Create the Vitest setup file**

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Write the failing unit smoke test**

Create `lib/i18n.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { isLocale } from "@/lib/i18n";

describe("isLocale", () => {
  test("accepts a supported locale", () => {
    expect(isLocale("en")).toBe(true);
  });

  test("rejects an unsupported locale", () => {
    expect(isLocale("zz")).toBe(false);
  });
});
```

- [ ] **Step 5: Run it and confirm the runner works**

Run: `npm test`
Expected: PASS — 2 passed (`lib/i18n.test.ts`). (`isLocale` already exists in `lib/i18n.ts`, so this should pass immediately. The point of this step is to prove Vitest, the `@/*` alias, and TypeScript all resolve.)

If it FAILS with "cannot find module '@/lib/i18n'", the alias in `vitest.config.ts` is wrong — re-check Step 2.

- [ ] **Step 6: Write the React/RTL smoke test**

Create `components/portal/PrintButton.test.tsx`:

```tsx
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import PrintButton from "@/components/portal/PrintButton";

describe("PrintButton", () => {
  test("renders its label", () => {
    render(<PrintButton label="Print summary" />);
    expect(
      screen.getByRole("button", { name: /print summary/i }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS — 3 passed across 2 files. (This confirms jsdom rendering, RTL queries, and the jest-dom matchers all work — the foundation Plans 2/3 build on.)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts lib/i18n.test.ts components/portal/PrintButton.test.tsx
git commit -m "test: add Vitest + React Testing Library with smoke tests"
```

---

## Task 5: Enable the pgTAP extension via a migration

**Files:**
- Create: `supabase/migrations/<ts>_enable_pgtap.sql` (via CLI)

pgTAP must be installed in the database before SQL tests can run. This follows the official Supabase testing guide.

- [ ] **Step 1: Create the migration file**

Run: `npx supabase migration new enable_pgtap`
Expected: prints `Created new migration at supabase/migrations/<timestamp>_enable_pgtap.sql` (timestamp is the current UTC time, so it sorts after `20260519000000_init.sql`).

- [ ] **Step 2: Fill in the migration**

Open the new `supabase/migrations/<timestamp>_enable_pgtap.sql` and set its contents to:

```sql
-- Enable pgTAP so database tests in supabase/tests/ can run.
-- Safe to apply to the cloud project too — it only adds test helper functions.
create extension if not exists pgtap with schema extensions;
```

- [ ] **Step 3: Apply it locally**

Run: `npm run db:reset`
Expected: the reset log now includes `Applying migration <timestamp>_enable_pgtap.sql...` with no error.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations
git commit -m "test(db): enable pgTAP extension for database tests"
```

---

## Task 6: Write the security tests (they must fail first)

**Files:**
- Create: `supabase/tests/nurse_write_rls.test.sql`

These tests encode the rules from spec §3 and §6. They will FAIL now because the lifecycle columns, audit table, and transition functions don't exist yet — that's the point. Task 7 makes them pass.

- [ ] **Step 1: Write the pgTAP test file**

Create `supabase/tests/nurse_write_rls.test.sql`:

```sql
-- Nurse-write portal: Row-Level Security + state-machine proof.
-- Run with: npm run test:db
-- Setup runs as the postgres superuser (bypasses RLS). We then impersonate
-- each role by setting the JWT claim 'sub' (what auth.uid() reads) and the
-- 'authenticated' database role (what RLS policies run as), and assert access.

begin;
select plan(24);

-- ── Fixtures ─────────────────────────────────────────────────────────────
-- Auth users. Inserting into auth.users fires handle_new_user(), which creates
-- a public.profiles row (default role 'family').
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','coord@test.dev','{"display_name":"Coordinator"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','nurseA@test.dev','{"display_name":"Nurse A"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','nurseB@test.dev','{"display_name":"Nurse B"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fam1@test.dev','{"display_name":"Family One"}', now(), now()),
  ('55555555-5555-5555-5555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','fam2@test.dev','{"display_name":"Family Two"}', now(), now());

-- Roles
update public.profiles set role = 'coordinator' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'nurse'       where id in ('22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333');

-- Families + memberships
insert into public.families (id, display_name) values
  ('66666666-6666-6666-6666-666666666666','Family One'),
  ('77777777-7777-7777-7777-777777777777','Family Two');
insert into public.family_memberships (family_id, user_id, membership_role) values
  ('66666666-6666-6666-6666-666666666666','44444444-4444-4444-4444-444444444444','owner'),
  ('77777777-7777-7777-7777-777777777777','55555555-5555-5555-5555-555555555555','owner');

-- Patients
insert into public.patients (id, family_id, display_label, district) values
  ('88888888-8888-8888-8888-888888888888','66666666-6666-6666-6666-666666666666','Mariam','Achrafieh'),
  ('99999999-9999-9999-9999-999999999999','77777777-7777-7777-7777-777777777777','Georges','Hamra');

-- Nurse provider records
insert into public.nurses (id, user_id, display_name, hospital, active) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','22222222-2222-2222-2222-222222222222','Nurse A','AUBMC', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','33333333-3333-3333-3333-333333333333','Nurse B','Hôtel-Dieu', true);

-- Cases
insert into public.cases (id, patient_id, case_ref, mode, status) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','88888888-8888-8888-8888-888888888888','Case 2026-101','shift','active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd','99999999-9999-9999-9999-999999999999','Case 2026-102','visit','active');

-- Visits (V1 assigned to Nurse A, V2 to Nurse B)
insert into public.visits (id, case_id, scheduled_at, assigned_nurse_id, status) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','cccccccc-cccc-cccc-cccc-cccccccccccc', now() - interval '1 day','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','completed'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff','dddddddd-dddd-dddd-dddd-dddddddddddd', now() - interval '1 day','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','completed');

-- Draft summaries (one per visit)
insert into public.visit_summaries (id, visit_id, done_body, status) values
  ('10101010-1010-1010-1010-101010101010','eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','orig','draft'),
  ('20202020-2020-2020-2020-202020202020','ffffffff-ffff-ffff-ffff-ffffffffffff','orig2','draft');

-- ── Helper: impersonation is done inline with set local role + jwt claim ──

-- 1. Family One sees no draft summaries
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select is(
  (select count(*)::int from public.visit_summaries),
  0,
  'family sees no summaries while everything is draft'
);

-- 2. Family One sees only its own patient
select is(
  (select count(*)::int from public.patients),
  1,
  'family sees only its own patient'
);
reset role;

-- 3. Family Two sees no draft summaries
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select is(
  (select count(*)::int from public.visit_summaries),
  0,
  'family two sees no draft summaries'
);
reset role;

-- 4. Nurse A sees exactly her own assigned summary
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select is(
  (select count(*)::int from public.visit_summaries),
  1,
  'assigned nurse sees her own summary'
);

-- 5. Nurse A cannot see Nurse B's visit summary
select is(
  (select count(*)::int from public.visit_summaries where visit_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'),
  0,
  'nurse cannot see another nurse''s visit summary'
);

-- 6. Nurse A can edit her own draft content
select lives_ok(
  $$ update public.visit_summaries set done_body = 'edited' where id = '10101010-1010-1010-1010-101010101010' $$,
  'nurse can edit draft content'
);

-- 7. Nurse A cannot self-publish via a raw update (with-check denies it)
-- 4-arg form: (sql, errcode, errmsg, description). NULL errcode + NULL errmsg
-- means "assert that ANY exception is raised"; the last arg is the test name.
select throws_ok(
  $$ update public.visit_summaries set status = 'published' where id = '10101010-1010-1010-1010-101010101010' $$,
  null::text, null::text,
  'nurse cannot raw-update a summary into published'
);

-- 8. Nurse A submits via the state-machine function
select lives_ok(
  $$ select public.submit_summary('10101010-1010-1010-1010-101010101010') $$,
  'nurse can submit her summary'
);
reset role;

-- 9. Status is now submitted
select is(
  (select status from public.visit_summaries where id = '10101010-1010-1010-1010-101010101010'),
  'submitted',
  'status is submitted after submit'
);

-- 10. Submit wrote exactly one audit event
select is(
  (select count(*)::int from public.visit_summary_events where visit_summary_id = '10101010-1010-1010-1010-101010101010'),
  1,
  'submit writes one audit event'
);

-- 11. Nurse A cannot publish (coordinator-only)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select throws_ok(
  $$ select public.publish_summary('10101010-1010-1010-1010-101010101010') $$,
  null::text, null::text,
  'nurse cannot publish'
);
reset role;

-- 12 & 13. Coordinator opens review, then publishes
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ select public.open_review('10101010-1010-1010-1010-101010101010') $$,
  'coordinator can open review'
);
select lives_ok(
  $$ select public.publish_summary('10101010-1010-1010-1010-101010101010') $$,
  'coordinator can publish'
);
reset role;

-- 14. Status is published
select is(
  (select status from public.visit_summaries where id = '10101010-1010-1010-1010-101010101010'),
  'published',
  'status is published after publish'
);

-- 15. published_at was set
select ok(
  (select published_at is not null from public.visit_summaries where id = '10101010-1010-1010-1010-101010101010'),
  'published_at is set on publish'
);

-- 16. Family One now sees the published summary
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}';
select is(
  (select count(*)::int from public.visit_summaries),
  1,
  'family sees the summary once published'
);
reset role;

-- 17. A nurse update on a published summary is a silent no-op (RLS using-filter excludes the row)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select lives_ok(
  $$ update public.visit_summaries set done_body = 'HACK' where id = '10101010-1010-1010-1010-101010101010' $$,
  'nurse update on published summary does not error (affects no rows)'
);
reset role;

-- 18. ...and the published content is unchanged
select is(
  (select done_body from public.visit_summaries where id = '10101010-1010-1010-1010-101010101010'),
  'edited',
  'published content cannot be modified by the nurse'
);

-- 19. Even the coordinator cannot UPDATE an audit event (no update policy → no-op)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ update public.visit_summary_events set reason = 'tamper' where visit_summary_id = '10101010-1010-1010-1010-101010101010' $$,
  'audit event update affects no rows'
);
reset role;

-- 20. No audit event was actually changed
select is(
  (select count(*)::int from public.visit_summary_events where reason = 'tamper'),
  0,
  'audit log is not modifiable'
);

-- 21. Even the coordinator cannot DELETE an audit event (no delete policy → no-op)
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
select lives_ok(
  $$ delete from public.visit_summary_events where visit_summary_id = '10101010-1010-1010-1010-101010101010' $$,
  'audit event delete affects no rows'
);
reset role;

-- 22. All three events remain (submit, open_review, publish)
select is(
  (select count(*)::int from public.visit_summary_events where visit_summary_id = '10101010-1010-1010-1010-101010101010'),
  3,
  'audit log is append-only: submit + open_review + publish intact'
);

-- 23. Family Two cannot read Family One's audit events
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"55555555-5555-5555-5555-555555555555","role":"authenticated"}';
select is(
  (select count(*)::int from public.visit_summary_events where visit_summary_id = '10101010-1010-1010-1010-101010101010'),
  0,
  'a family cannot read another family''s audit events'
);
reset role;

-- 24. The assigned nurse can read her summary's audit events
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';
select ok(
  (select count(*)::int from public.visit_summary_events where visit_summary_id = '10101010-1010-1010-1010-101010101010') > 0,
  'assigned nurse can read her summary audit events'
);
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Run the tests and confirm they FAIL**

Run: `npm run test:db`
Expected: FAIL. The errors will mention missing objects — e.g. `column "status" ... does not exist` or `function public.submit_summary(uuid) does not exist`. This is correct: the schema this test expects has not been built yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add supabase/tests/nurse_write_rls.test.sql
git commit -m "test(db): add failing RLS + state-machine tests for nurse-write"
```

---

## Task 7: Write the migration that makes the tests pass

**Files:**
- Create: `supabase/migrations/<ts>_nurse_write.sql` (via CLI)

- [ ] **Step 1: Create the migration file**

Run: `npx supabase migration new nurse_write`
Expected: `Created new migration at supabase/migrations/<timestamp>_nurse_write.sql`.

- [ ] **Step 2: Fill in the migration**

Open the new `supabase/migrations/<timestamp>_nurse_write.sql` and set its contents to:

```sql
-- Nurse-write portal (slice L): summary lifecycle, audit log, RLS tightening.
-- Builds on 20260519000000_init.sql. No destructive changes to existing tables.

-- ─────────────────────────────────────────────────────────
-- 1. Lifecycle columns on visit_summaries
-- ─────────────────────────────────────────────────────────
alter table public.visit_summaries
  add column if not exists status text not null default 'draft'
    check (status in ('draft','submitted','in_review','changes_requested','published')),
  add column if not exists sent_back_reason text,
  add column if not exists submitted_at timestamptz,
  add column if not exists published_at timestamptz;

create index if not exists visit_summaries_status_idx on public.visit_summaries(status);

-- Existing finalised rows (e.g. the seed summary) are treated as published.
update public.visit_summaries
  set status = 'published',
      published_at = coalesce(published_at, written_at)
  where finalised = true and status = 'draft';

-- ─────────────────────────────────────────────────────────
-- 2. Append-only audit log
-- ─────────────────────────────────────────────────────────
create table if not exists public.visit_summary_events (
  id uuid primary key default uuid_generate_v4(),
  visit_summary_id uuid not null references public.visit_summaries(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  from_status text,
  to_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists visit_summary_events_summary_idx
  on public.visit_summary_events(visit_summary_id);

alter table public.visit_summary_events enable row level security;

-- Readable by: coordinator, the assigned nurse, or a member of the patient's family.
create policy "read events for accessible summaries"
  on public.visit_summary_events for select
  using (
    public.is_coordinator()
    or exists (
      select 1
      from public.visit_summaries vs
      join public.visits v on v.id = vs.visit_id
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where vs.id = visit_summary_id
        and (public.is_family_member(p.family_id) or public.is_assigned_nurse(vs.visit_id))
    )
  );

-- Insertable by: coordinator or the assigned nurse for that summary.
-- (In practice every event is written by the SECURITY DEFINER functions below,
--  which run as the table owner and bypass RLS. This policy is the safety net
--  for any direct insert. Crucially there is NO update or delete policy, so the
--  log is append-only for everyone using the API — nobody can edit or remove
--  history, not even a coordinator.)
create policy "insert events for own summaries"
  on public.visit_summary_events for insert
  with check (
    public.is_coordinator()
    or exists (
      select 1 from public.visit_summaries vs
      where vs.id = visit_summary_id and public.is_assigned_nurse(vs.visit_id)
    )
  );

-- ─────────────────────────────────────────────────────────
-- 3. Retarget the nurse content-edit policy to the new states
-- ─────────────────────────────────────────────────────────
-- A nurse may edit clinical content only while a summary is draft or
-- changes_requested. The with-check keeps the row in an editable state, so a
-- nurse can never raw-update a summary into submitted/in_review/published.
drop policy if exists "assigned nurses can update their not-yet-finalised summaries"
  on public.visit_summaries;

create policy "assigned nurses can edit editable summaries"
  on public.visit_summaries for update
  using (public.is_assigned_nurse(visit_id) and status in ('draft','changes_requested'))
  with check (public.is_assigned_nurse(visit_id) and status in ('draft','changes_requested'));

-- ─────────────────────────────────────────────────────────
-- 4. Tighten family read access to PUBLISHED only
-- ─────────────────────────────────────────────────────────
drop policy if exists "family members can read summaries for their visits"
  on public.visit_summaries;

create policy "family members can read published summaries"
  on public.visit_summaries for select
  using (
    status = 'published'
    and exists (
      select 1
      from public.visits v
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where v.id = visit_id and public.is_family_member(p.family_id)
    )
  );

drop policy if exists "family members can read photos for their summaries"
  on public.wound_photos;

create policy "family members can read photos for published summaries"
  on public.wound_photos for select
  using (
    exists (
      select 1
      from public.visit_summaries vs
      join public.visits v on v.id = vs.visit_id
      join public.cases c on c.id = v.case_id
      join public.patients p on p.id = c.patient_id
      where vs.id = visit_summary_id
        and vs.status = 'published'
        and public.is_family_member(p.family_id)
    )
  );

-- ─────────────────────────────────────────────────────────
-- 5. State-machine functions (SECURITY DEFINER)
--    Each checks authorisation + current status, performs the transition,
--    and writes the audit event atomically.
-- ─────────────────────────────────────────────────────────
create or replace function public.submit_summary(target_summary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
  cur_visit uuid;
begin
  select status, visit_id into cur_status, cur_visit
    from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if not public.is_assigned_nurse(cur_visit) then
    raise exception 'not authorised';
  end if;
  if cur_status not in ('draft','changes_requested') then
    raise exception 'cannot submit from status %', cur_status;
  end if;

  update public.visit_summaries
    set status = 'submitted', submitted_at = now(), sent_back_reason = null
    where id = target_summary_id;

  insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status)
    values (target_summary_id, auth.uid(), cur_status, 'submitted');
end;
$$;

create or replace function public.open_review(target_summary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
begin
  if not public.is_coordinator() then
    raise exception 'not authorised';
  end if;
  select status into cur_status from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if cur_status = 'submitted' then
    update public.visit_summaries set status = 'in_review' where id = target_summary_id;
    insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status)
      values (target_summary_id, auth.uid(), 'submitted', 'in_review');
  end if;
end;
$$;

create or replace function public.publish_summary(target_summary_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
begin
  if not public.is_coordinator() then
    raise exception 'not authorised';
  end if;
  select status into cur_status from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if cur_status not in ('submitted','in_review') then
    raise exception 'cannot publish from status %', cur_status;
  end if;

  update public.visit_summaries
    set status = 'published', published_at = now(), finalised = true
    where id = target_summary_id;

  insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status)
    values (target_summary_id, auth.uid(), cur_status, 'published');
end;
$$;

create or replace function public.send_back_summary(target_summary_id uuid, send_back_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_status text;
begin
  if not public.is_coordinator() then
    raise exception 'not authorised';
  end if;
  select status into cur_status from public.visit_summaries where id = target_summary_id;
  if cur_status is null then
    raise exception 'summary not found';
  end if;
  if cur_status not in ('submitted','in_review') then
    raise exception 'cannot send back from status %', cur_status;
  end if;

  update public.visit_summaries
    set status = 'changes_requested', sent_back_reason = send_back_reason
    where id = target_summary_id;

  insert into public.visit_summary_events (visit_summary_id, actor_user_id, from_status, to_status, reason)
    values (target_summary_id, auth.uid(), cur_status, 'changes_requested', send_back_reason);
end;
$$;

grant execute on function public.submit_summary(uuid) to authenticated;
grant execute on function public.open_review(uuid) to authenticated;
grant execute on function public.publish_summary(uuid) to authenticated;
grant execute on function public.send_back_summary(uuid, text) to authenticated;
```

- [ ] **Step 3: Apply the migration locally**

Run: `npm run db:reset`
Expected: reset log ends with `Applying migration <timestamp>_nurse_write.sql...` and no error.

- [ ] **Step 4: Run the security tests and confirm they PASS**

Run: `npm run test:db`
Expected: PASS — `nurse_write_rls.test.sql .. ok` with `# All 24 tests passed` (or pgTAP's equivalent all-green summary). If any assertion fails, read which number failed and fix the migration (not the test) — the test encodes the spec.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations
git commit -m "feat(db): summary lifecycle, append-only audit log, tightened RLS (slice L)"
```

---

## Task 8: Regenerate types, verify the build, and apply to the cloud database

**Files:**
- Modify: `lib/supabase/types.ts` (regenerated)

- [ ] **Step 1: Regenerate the TypeScript types from the local schema**

Run: `npm run db:types`
Expected: `lib/supabase/types.ts` is rewritten with real `Database` types for all tables (`profiles`, `visit_summaries` with the new `status`/`submitted_at`/`published_at`/`sent_back_reason` columns, `visit_summary_events`, the functions, etc.) — replacing the placeholder `Tables: Record<string, never>`.

- [ ] **Step 2: Confirm the production build still typechecks**

Run: `npm run build`
Expected: `✓ Compiled successfully` with no TypeScript errors. (The existing portal code casts Supabase queries with `as any`, so richer types won't break it; this step confirms that.)

- [ ] **Step 3: Run the whole test suite once more**

Run: `npm test`
Expected: PASS — 3 passed. (Confirms the regenerated types didn't break the component tests.)

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "chore(db): regenerate Supabase types from new schema"
```

- [ ] **Step 5: Apply the migration to the CLOUD project**

The live site (Vercel) and local `npm run dev` both talk to the cloud database, so the new schema must be applied there too. **Choose ONE** of the following:

**Option A — Supabase Dashboard (matches the existing project habit, no DB password needed):**
1. Open https://app.supabase.com/project/mudjjpnxjjapdcxhhngj/sql/new
2. Paste the entire contents of the new `supabase/migrations/<timestamp>_nurse_write.sql`, click **Run**.
3. Then open a second SQL tab and run the one line from `<timestamp>_enable_pgtap.sql` (`create extension if not exists pgtap with schema extensions;`) so the cloud schema matches local. (Optional — pgTAP is only used locally — but keeping them identical avoids drift.)

**Option B — CLI push (cleaner once you're set up; needs the database password):**
```bash
npx supabase link --project-ref mudjjpnxjjapdcxhhngj
npx supabase db push
```
`db push` applies every not-yet-applied migration (the pgTAP one and the nurse_write one) to the cloud project. It will prompt for the database password (found in Dashboard → Project Settings → Database).

- [ ] **Step 6: Verify the cloud schema updated**

In the Supabase Dashboard → **Table Editor**, confirm `visit_summary_events` now appears, and open `visit_summaries` to confirm the `status` column exists.
Expected: both present.

No commit (cloud-side change only; the migration file is already committed).

---

## Done — what Plan 1 delivered

- A working automated test setup: `npm test` (components) and `npm run test:db` (database security).
- A local database sandbox you can reset at will (`npm run db:reset`).
- The summary lifecycle (`draft → submitted → in_review → changes_requested → published`), enforced by `SECURITY DEFINER` functions the UI in Plans 2/3 will call.
- An append-only audit log proven to be tamper-resistant.
- Family read access tightened to published-only (required before slice M).
- Real database types for Plans 2/3 to build against.

**Plan 2 (Coordinator tools)** picks up here: the role-aware portal home, invite-a-nurse, and schedule-a-visit — using the schema and types this plan created.

---

## Self-review notes (for the author)

- **Spec §3 (lifecycle):** five states + send-back + published-lock — covered by the migration (status check, transition functions) and Tasks 6–7 tests 8–22.
- **Spec §6 (data/schema):** status/sent_back_reason/submitted_at/published_at (Task 7 §1), `visit_summary_events` append-only (Task 7 §2, tests 19–22), retargeted nurse update (§3, tests 6–7,17–18), family read = published (§4, tests 1,3,16), wound-photo read tightened (§4). Nurse-invite admin-client work is intentionally deferred to Plan 2 (it's a coordinator tool, not schema).
- **Spec §8 (compliance):** RLS on the new table, append-only proof, published-only family read, no PHI in any test output (fixtures use fake names/emails).
- **Type consistency:** transition function names used in tests match the migration exactly — `submit_summary(uuid)`, `open_review(uuid)`, `publish_summary(uuid)`, `send_back_summary(uuid, text)`. `send_back_summary`'s 2nd parameter is named `send_back_reason` to avoid colliding with the `sent_back_reason` column inside the function body.
- **No placeholders:** the only `<ts>`/`<timestamp>` tokens are real migration filenames generated by `supabase migration new`, which the engineer fills from the CLI output. Every code block is complete.
