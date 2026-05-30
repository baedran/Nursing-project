# Supabase

The marketing site's portal layer (Phase 2) uses Supabase for Postgres, auth, and storage.

## Initial migration

The first migration creates all core tables, RLS policies, helper functions, and the wound-photos storage bucket.

**To apply it manually (one time):**

1. Go to https://app.supabase.com/project/mudjjpnxjjapdcxhhngj/sql/new
2. Paste the contents of `supabase/migrations/20260519000000_init.sql`
3. Click **Run**
4. Verify in the Table Editor (left sidebar) that the new tables appear: profiles, families, family_memberships, patients, nurses, cases, visits, visit_summaries, wound_photos.

**To apply via Supabase CLI (recommended once we get there):**

```bash
npm install -g supabase
supabase login
supabase link --project-ref mudjjpnxjjapdcxhhngj
supabase db push
```

## Local env

`.env.local` at the project root (gitignored) holds:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

The same three vars must be added to Vercel: Project Settings → Environment Variables.

## Regenerating types

After schema changes, regenerate `lib/supabase/types.ts`:

```bash
npx supabase gen types typescript --project-id mudjjpnxjjapdcxhhngj > lib/supabase/types.ts
```

## Compliance notes

- Every table touching patient data has Row-Level Security enabled.
- Wound photos live in a private bucket; access via signed URLs only.
- Soft deletes (deleted_at) instead of hard deletes preserve audit trail.
- Never log PHI (names, vitals, photos). Never send PHI to third-party analytics.
- `service_role` key bypasses RLS — use the admin client sparingly and only on the server.
