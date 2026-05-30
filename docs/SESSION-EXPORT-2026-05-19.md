# Session Export — 2026-05-19
## Caregivers Collective · design restart

## What this document is
A handoff briefing for Claude Chat (or any AI collaborator) joining mid-stride on the Caregivers Collective marketing-site design work. Covers what is locked, what is open, what was tried and rejected this session, and what we are doing next. Read together with `RESUME-2026-05-13.md` for full project context.

---

## Project context (cold-start)

**Caregivers Collective** — home-nursing coordination platform for Beirut and Mount Lebanon. Solo founder (BSN nurse, minimal coding background, 42 Beirut C). Hospital-employed Lebanese RNs/PNs do shifts on their off-days; bookings happen on WhatsApp; a written visit summary lands in the family portal the same day.

Marketing site is the current focus. Portal MVP is Phase 2 (Supabase + RLS, deferred).

**Stack:** Next.js 16 (App Router) + Tailwind v4 + TypeScript. Vercel. Existing 7-page bilingual EN/AR build is placeholder-grade.

**Founder constraint:** brand-as-entity. No personal photo, named bio, first-person voice, or "founder" word anywhere on the site (employer-risk).

---

## Decisions locked BEFORE this session
(condensed from `RESUME-2026-05-13.md`)

- **Brand:** Caregivers Collective (Latin script everywhere including in AR copy)
- **Positioning (3 pillars):** A — Documented (demoted to feature, not hero pillar) · D — Diaspora · G — Smart matching, not cheap
- **Business model:** PRN platform. Three pricing modes (visit / shift / subscription). Prepaid. Quote-only public.
- **Year-1 services:** PN/RN shifts, wellness subscription, IM/SubQ injection, IV insertion + hydration, IV medication administration, bath, wound care, Foley insertion, blood draw
- **Dropped from year 1:** live-in care, NG tube, ICU/tracheostomy specialty, Holter, oxygen rental
- **Site IA (9 routes):** home, services, packages, how-we-work, diaspora, FAQ, for-nurses, contact, blog scaffold
- **Photography source:** Centre for Ageing Better Unsplash collection
- **Copy rules:** smart curly quotes, no founder/first-person/agency/dollar-amounts/AI-slop verbs
- **Languages:** EN · AR · FR (only EN copy exists currently; AR uses Latin script for brand names; FR not started)
- **Existing high-fidelity design:** `Caregivers Collective.html` (~115KB single-file HTML mockup) — was the "locked" direction before this session

---

## Decisions made IN this session (2026-05-19)

### Locked

- **Hero composition shape:** text overlaid ON full-bleed photo (cinematic). Confirmed twice.
- **Mono font:** Fragment Mono (free, on Fontshare). JetBrains Mono killed — AI-slop signal in dev/AI tools.
- **Approach:** the original `Caregivers Collective.html` design is the baseline. Specific edits, not full redesign.

### Reversed / rejected this session

These paths were generated and rejected. Listing so the next AI doesn't waste cycles re-proposing them:

- **12 palette options (A–L)** generated across 3 comparison pages. User cycled through, didn't lock.
- **4 dark-primary variants (E + M–P)** — blue-night, warm charcoal, espresso, forest, wine. User picked E, then forest, then back to "the original."
- **4 alternative homepages built**: palette A cream (homepage-v0), blue-night (homepage-v1-dark), forest (homepage-v2-forest), final cream (homepage-final). All rejected.
- **3 "vibe" moodboards**: Levantine editorial, Quiet domestic, Apothecary — rejected as AI slop.
- **Switzer-as-label** (no mono accent) — rejected as a downgrade. User wanted a mono with character.

### Frame I extracted from user references — still valid

The user's three reference sites (iveeapp.com, opalcamera.com, goodlifemeds.com) point to one common pattern:

**Healthcare as premium consumer brand — not as clinic, not as wellness magazine.** None of those sites looks like a hospital. None uses medical blue. All lean on real faces, polish, plain language, and visible competence. This is the frame the brand should sit in.

User flagged that "modern effects like parallax" + "full of life" doesn't mean GSAP theatre — it means the photography is alive and the page has restrained, considered motion.

### Active right now

Picking a hero composition variant. Five options have been built as working previews:

| # | Name | Move |
|---|------|------|
| 1 | Bottom-anchored block | Safe default; text + CTAs anchored bottom-left. Least distinctive. |
| 2 | Multi-photo cross-fade | Four visit scenes Ken-Burns through; headline stays. *Live* without animation theatre. |
| 3 | Pinned scroll-story | Hero pins; photo + text morph through 4 moments (Arrival → Vitals → Care → Summary). Turns the original CC's "typical visit" tab interaction *into* the hero. |
| 4 | Marquee headline | Giant horizontally-scrolling type across photo, alternating filled/outline. Bottega-coded. Most distinctive. |
| 5 | Floating witness | One floating element, but it's a WhatsApp conversation (coordinator typing reply), not the pulse-card vitals dashboard from the original. |

---

## Specific edits to the original design (likely list, not yet confirmed)

I flagged these as likely-to-change but the user has not yet sat down to confirm/edit them one-by-one:

- **Drop the pulse-card vitals dashboard** in the hero (Mother, 78 · Achrafieh BP/HR/SpO₂ mockup) — SaaS-coded slop signal
- **Reconsider the teal palette** (`--teal #2f7a76`, `--signal #4ec19a`)
- **Cut from 13 sections** down (user said "not too long scrolling")
- **Possibly swap Geist** for Cabinet Grotesk display + Switzer body (both free on Fontshare)
- **Possibly rework** the tabbed visit-dashboard section (auto-advancing tabs through 4 visit moments) — could become the hero (option 3 above) instead of a mid-page section
- **Photography**: Centre for Ageing Better collection lacks clinical-action shots (IV, IM injection, wound care). Needs different source or commissioned photography in Beirut.

---

## Open longer-term

- **Domain**: `.com.lb` / `.co` / `.care` / `thecaregiverscollective.com` / `caregiverscollectivebeirut.com` — not picked. `caregiverscol.com` is taken by a Florida home-care operation (different market, not a competitor, but owns the .com).
- **WhatsApp Business number**: placeholder `+961 X XXX XXX` in `lib/site.ts`. Single-line swap when ready.
- **5 content drafts** in flight from parallel conversation: visit summary template, vetting checklist, escalation flow, photo consent text, 3 blog drafts.
- **Arabic editor** engagement (committed for end of Phase 2).
- **Care-fit wizard** for /services (3-question decision tree ending in pre-filled WhatsApp). Not yet built.
- **Brand mark refinement** — current mark is a CSS-built gradient square with ring + dot. Provisional until designer signs off.

---

## What comes next

1. **Pick a hero variant (1–5)** + identify other specific edits to the original
2. Write design spec to `docs/superpowers/specs/2026-05-19-marketing-site-design.md`
3. User reviews and approves spec
4. Implementation plan via `superpowers:writing-plans` skill
5. **Phase 1 begins**: port the design to Next.js components + Tailwind v4 config (decompose `Caregivers Collective.html` into React components, port the OKLCH design tokens to `@theme`)
6. **Phase 2**: portal MVP with Supabase + RLS

---

## Where artifacts live (file map)

**Main repo (master branch):**
- 7 placeholder pages already built in `app/[locale]/*.tsx`
- `lib/site.ts`, `messages/en.json`, `messages/ar.json`, `components/Footer.tsx`, `components/Navbar.tsx`, `components/home/*.tsx`, `components/contact/ContactForm.tsx`
- This document: `docs/SESSION-EXPORT-2026-05-19.md`

**Worktree branch `claude/trusting-albattani-70717b`** at `.claude/worktrees/trusting-albattani-70717b/`:
- `docs/RESUME-2026-05-13.md` — full project state at start of design exploration
- `docs/SESSION-EXPORT-2026-05-11.md` — earlier export to parallel claude.ai conversation
- `docs/AI-DESIGN-HANDOFF-2026-05-12.md` — prompt that produced the original Caregivers Collective design
- `docs/external-design/design_handoff_caregivers_collective/Caregivers Collective.html` — the design source-of-truth (115KB, self-contained)
- `docs/external-design/design_handoff_caregivers_collective/README.md` — 22KB design tokens + section specs from claude.ai

**This session's working files (gitignored):** `.superpowers/brainstorm/308-1779183088/content/`
- `hero-ideas.html` — five hero variants currently open in the user's browser
- `homepage-final.html`, `homepage-v1-dark.html`, `homepage-v2-forest.html` — rejected alternative homepages
- `palette-options*.html` — rejected palette comparison pages
- `reference-analysis.html` — analysis of user's three reference sites

---

## How to use this document in Claude Chat

Paste this whole document at the start of your Claude Chat conversation. Tell the AI:

> "I'm collaborating between two AI environments on a Beirut homecare platform design. This document is the current state. I need you to help me with [specific question — e.g., picking between the 5 hero variants, reviewing copy, sourcing photography, anything strategic]."

The other AI now has context to advise without re-litigating decisions already made.

---

## Honest read on the session

I (the Claude Code agent on this end) over-generated options and got the user tangled up in a palette/homepage rabbit hole. The user's instinct to go back to the original CC design was correct — none of my regenerations beat it. The brainstorming served one real purpose: confirming the original design (with specific edits) is the path forward, and that the user's references point to a "premium consumer brand" frame rather than a clinic/magazine frame.

Recommend the next AI focus on **concrete edits** rather than regeneration. The structure works; the spirit works; specific elements need to be swapped.
