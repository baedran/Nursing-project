# Homecare Platform — Project Context

## What this is
A home nursing coordination platform for Beirut/Mount Lebanon. Connects families needing home care with licensed nurses. Includes clinical charting (SOAP notes, vitals, wound photos) for long-term home patients.

## Who I am
Solo founder. BSN nurse, minimal coding experience (some C from 42 Beirut). I'm learning as I go. Explain decisions in plain language. Suggest the simpler option when there's a tradeoff.

## Stack
- Frontend: Next.js 15 (App Router) + Tailwind CSS + TypeScript
- Backend: Supabase (Postgres + Auth + Storage) — added in phase 2
- Hosting: Vercel
- Forms: native React forms, validated with Zod

## Compliance baseline
- All patient data is PHI. Treat it as sensitive.
- Use Supabase Row-Level Security on every table touching patient data.
- Wound images stored in private buckets with signed URLs only.
- Never log PHI. Never send PHI to third-party analytics.

## How I want you to work
- Default to Plan Mode for any feature touching more than 2 files.
- Commit after every working feature with a clear message.
- Write small, readable code over clever code.
- When you're unsure, ask me before assuming.
- Explain any new concept the first time you use it (e.g., "this is what RLS means").

## Next.js note
This project uses Next.js 15 App Router. APIs and conventions may differ from older versions. Check `node_modules/next/dist/docs/` when in doubt.
