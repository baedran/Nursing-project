# Resume prompt — paste this at the start of a fresh Claude Code session

---

I'm continuing the **Caregivers Collective** project. Read these in order before anything else:

1. `HANDOFF.md` at the project root — full project context, design system, file map, deferred items
2. `docs/superpowers/specs/2026-05-19-marketing-site-design.md` — locked visual spec
3. `supabase/README.md` — how to apply migrations + regenerate types
4. Recent commits: `git log --oneline -30`

**Working directory:** `c:\Users\theom\Desktop\New proj` · Windows · PowerShell + Bash both available

## Where I am right now

The **marketing site** (8 pages + mobile menu + care wizard) is live, deployed, Lighthouse 96/100/96/100:
- `https://nursing-project-olive.vercel.app/en`

**Phase 2 (the family portal) is in progress.** Three slices done so far:
- **J — `/what-we-send`** — static visit summary template, lives in `components/portal/VisitSummaryDocument.tsx` (reusable when we wire real data)
- **K — Supabase foundation** — `lib/supabase/{client,server,admin,middleware}.ts`, schema in `supabase/migrations/20260519000000_init.sql`, env vars in `.env.local` (gitignored) and on Vercel
- **N — Auth + portal shell** — magic-link login at `/login`, protected `/portal` (currently shows my role + patients list + sample CTA), Topbar shows "Log in" / "Portal" based on auth state, custom SMTP via Resend wired in Supabase. Working end-to-end. Seed data created a test family + patient "Mariam · Achrafieh" + Case 2026-051 + a completed visit + a sample summary.

My Supabase user UUID (already promoted to `coordinator` role): `141ae2e4-d746-4dc9-b1ed-c8668950e5c5`. Supabase project ref: `mudjjpnxjjapdcxhhngj`.

## Still in flight when this session ended

The latest commit `afe6de3` fixed a Tailwind v4 quirk where the "View sample summary" CTA inside `/portal` was rendering as an invisible-text black blob (same bug as the WhatsApp button earlier — the `text-paper` utility isn't always generated, fixed by inline CSS vars). Vercel was redeploying when we stopped.

## What's next on the menu

Pick one when I'm ready:

- **L — nurse-write portal**: nurses log in, see assigned visits, write summaries that land in real families' portals. Multi-session. Needs nurse-role onboarding flow.
- **M — family-read view**: click a patient → see their case + visits + the actual rendered `VisitSummaryDocument` pulling real Supabase data instead of dict copy. Probably the most rewarding next step because it makes the whole thing concretely useful.
- **Real WhatsApp Business number + domain**: one-line swaps in `lib/site.ts`. Cheap polish.
- **Resend custom SMTP for production**: wire a verified domain (when I pick one) so emails come from `@my-domain` instead of `onboarding@resend.dev`. Currently emails only deliver to my own verified Resend address.
- **Audit log table + finer storage policies**: deferred from slice K — I flagged this when the foundation was set up.

## How I want to work with you

- **Plain language, no coder jargon** — I'm a BSN nurse, not a developer. Explain *why* before *how*. Don't use abbreviations without defining them first.
- **Show me everything in the browser** — when there's a decision, build a visual page, push it to my browser, ask me to pick. Use `Invoke-Item` on local HTML files. Don't make me read walls of text.
- **Auto-approve routine commands** — `Invoke-Item`, file reads, status checks. Don't keep asking permission for things I've already cleared.
- **Tight responses** — short attention span. 2-3 sentences per update is usually right. Long content goes to browser pages.
- **For visual / authenticated pages I need verified**: at the start of the session, install a Chrome MCP (`playwright-mcp` or `chrome-devtools-mcp`) so you can actually see what I see instead of asking me to describe it. Last session you didn't have one and we lost time on that.
- **Don't reset the design** — every visual decision is locked. Don't regenerate alternatives unless I ask.

## Brand recap (in case you skip the spec)

- **Caregivers Collective** — home nursing for Beirut & Mt. Lebanon
- **Primary audience**: Lebanese diaspora — adult children abroad (Paris persona) with parents back home
- **Premium / high-ticket positioning**: no prices public, quote-only via WhatsApp
- **Brand-as-entity**: never reference me personally. No founder, no "I/my" voice.
- **Locked palette**: cream (#f7f7f3), ink (#1f2a35), teal (#2f7a76), signal-green (#4ec19a), peach (#e8b58a), night (#13202c)
- **Fonts**: Cabinet Grotesk (display) + Switzer (body) + Fragment Mono (small labels) — all via Fontshare CDN

## Recommended first move

Install a Chrome MCP. Then check Vercel deployed cleanly:
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://nursing-project-olive.vercel.app/en/portal
```
Then read `HANDOFF.md` so you've got the full file map, then ask me which slice next (L / M / something smaller).

---
