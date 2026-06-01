> **Update 2026-06-01 (later) — Nurse mobile app shipped as an installable PWA.**
>
> Nurses can now install the portal on their phone as a home-screen app. We did
> NOT build a native app — we turned the **existing** mobile-responsive portal
> into a **PWA** (Progressive Web App): same screens, same login, same data, same
> security; it just gains a home-screen icon and opens full-screen. Chosen over
> native because the founder is solo + non-coder (a native app = a second/third
> codebase forever), connectivity is fine during visits (so no offline-sync
> needed — the one real native advantage), the camera already works via the file
> input, updates are instant (deploy → everyone has it), and it costs $0.
>
> **Five pieces added:**
> 1. **Manifest** — `app/manifest.ts` (served at `/manifest.webmanifest`): name
>    "Caregivers Collective", `display: standalone`, `start_url: /en/portal`,
>    brand colors (`theme_color #1a504f`, `background_color #f7f7f3`).
> 2. **Designed brand icon** — no logo image existed (brand is a wordmark), so the
>    icon is a designed mark: a teal "C" cradling a dot (the cared-for person).
>    Source SVGs in `assets/`; regenerate the PNGs with
>    `node scripts/generate-icons.mjs` (uses `sharp`, a **dev-only** dependency).
>    Outputs: `public/icons/icon-{192,512}.png`, `icon-maskable-512.png` (Android
>    adaptive), `app/icon.png` (favicon), `app/apple-icon.png` (iPhone).
> 3. **Minimal service worker** — `public/sw.js` (~30 lines, hand-written, no PWA
>    library on purpose so it stays auditable). **PHI rule: it caches ONLY static
>    assets** (`/_next/static/*`, `/icons/*`, `/offline.html`). Navigations and all
>    data/photos are **network-only** — portal HTML, summaries, wound photos, and
>    Supabase responses are **never** cached. Registered prod-only via
>    `components/pwa/RegisterServiceWorker.tsx` (a SW fights hot-reload in dev).
>    `public/offline.html` is a PHI-free "no connection" fallback.
> 4. **iPhone + theme wiring** — in `app/[locale]/layout.tsx`: manifest link,
>    `appleWebApp` (title "Caregivers"), `themeColor`, and a legacy
>    `apple-mobile-web-app-capable` meta in `<head>` for iPhones on iOS < 15.4
>    (Next only emits the modern `mobile-web-app-capable`).
> 5. **Install help page** — `app/[locale]/install/page.tsx` +
>    `components/pwa/InstallGuide.tsx`. Open it **on the nurse's phone** during
>    training; it auto-detects iPhone vs Android and shows the right 3 steps (with
>    a manual tab toggle). Strings in `messages/{en,ar}.json` under `install.*`
>    (Arabic translated, not placeholder). No nagging install banner anywhere else.
>
> **How a nurse installs it:** open `nursing-project-olive.vercel.app/en/install`
> → **iPhone:** Share → "Add to Home Screen" · **Android:** ⋮ menu → "Install app".
>
> **Verified in a real browser (production build):** SW registers and activates;
> manifest valid + installable; after browsing, the cache held ONLY
> `/_next/static/*` + `/icons/*` + `/offline.html` — **zero patient data, no page
> HTML** (the PHI guarantee, proven not just claimed).
>
> **By design (deferred, not forgotten):** no offline editing, no push
> notifications, no App Store / Play Store, no PHI in cache, no portal redesign.
>
> **Test counts now: 22 unit (`npm test`) + 57 integration (`npm run test:rls`).**
> The 4 new unit tests cover the manifest and the install guide. New unit tests
> live under `tests/pwa/`. Spec + plan:
> `docs/superpowers/{specs,plans}/2026-06-01-nurse-mobile-pwa*.md`.
>
> ---
>
> **Update 2026-06-01 — Shareable summary link (Option C) shipped + invite-only auth + encoding fix.**
>
> Since the 2026-05-31 update below, three things shipped (all live, pushed to
> `master`, HEAD `311f010`):
>
> 1. **No-login share link (Option C).** A coordinator publishes a summary →
>    the review screen shows a **Copy link** + **Send on WhatsApp** button (and
>    on any already-published summary, so re-sending is free). The link
>    `/<locale>/s/<token>` opens the full read-only summary with **no account /
>    no login**, expires in **30 days**, uses an unguessable ~32-char token, and
>    reveals exactly one *published* summary (garbage/expired/draft tokens show a
>    friendly "unavailable" page and leak nothing — proven by tests). Includes
>    **Download / Print → Save as PDF**. PHI never enters WhatsApp — only the
>    opaque link does. $0 recurring (no WhatsApp Business API). Files: migration
>    `*_summary_share_links.sql`; `lib/portal/share.ts` (`generateToken`,
>    `shareExpiry`, `SHARE_TTL_DAYS=30`); `loadSummaryByToken` in
>    `lib/portal/summary.ts`; `createShareLink` action; `ShareLinkPanel.tsx`;
>    public page `app/[locale]/s/[token]/page.tsx`; `tests/rls/share-link.itest.ts`.
>    Spec + plan: `docs/superpowers/{specs,plans}/2026-06-01-shareable-summary-link-*.md`.
> 2. **Invite-only auth.** Login no longer creates accounts
>    (`shouldCreateUser:false` + Supabase `disable_signup:true`); a non-invited
>    email gets the same neutral "check your email" message but no link/account.
> 3. **Encoding fix.** The old sample summary showed mojibake (`â€"`, `Â°C`).
>    Cause: the SQL-seed path (`scripts/db-query.mjs`) sent text without a UTF-8
>    charset header. The live app write path was never affected. Fixed the
>    sample + added `charset=utf-8` to the helper. **Seed text via supabase-js,
>    not raw SQL.**
>
> **Test counts now: 18 unit (`npm test`) + 57 integration (`npm run test:rls`).**
> Run `test:rls` SEQUENTIALLY and never at the same time as DB-cleanup scripts.
>
> **NEXT SESSION: nurse mobile app** (see the resume prompt the founder pastes).
> Recommended first step: brainstorm PWA vs native — a PWA makes the *existing*
> mobile-responsive portal installable as a home-screen app icon (free, reuses
> everything, simplest to teach), vs a costly from-scratch native app.
>
> ---
>
> **Update 2026-05-31 — Phase 2 COMPLETE. The whole product is shipped & live.**
>
> The portal now works end-to-end for all three roles, verified in the browser
> by clicking through the real flow:
>
> 1. **Coordinator** (you, `theomarbadran@gmail.com`): invite a nurse → they get
>    a one-time sign-in link to send on WhatsApp · schedule & assign a visit ·
>    review each submitted summary · **publish** or **send back**.
> 2. **Nurse:** action-first dashboard · single-form writer (vitals, what-was-done,
>    observations, meds, watch-for, next visit) · **wound-photo upload** · Preview ·
>    Save draft · Submit.
> 3. **Family** (the daughter in Paris — the whole point): logs in → clicks their
>    patient → sees a card list of **published** visit summaries (newest flagged
>    "Latest") → opens the full read-only summary with wound photos via secure
>    signed links.
>
> **Summary lifecycle:** draft → submitted → in_review → (changes_requested ⟲) →
> published. Published is permanently **locked** (no silent edits to a record a
> family has read). Every transition is written to an **append-only audit log**.
> Enforced by SECURITY DEFINER RPCs: `submit_summary`, `open_review`,
> `publish_summary`, `send_back_summary`.
>
> **Routes** (all under `app/[locale]/portal/`, gated by the auth layout):
> `page.tsx` (role router → FamilyHome / NurseDashboard / CoordinatorHome),
> `nurses/`, `schedule/`, `review/[summaryId]/`, `visits/[visitId]/summary/`,
> `patients/[patientId]/` (family visit list), `patients/[patientId]/visits/[summaryId]/`
> (family read-only summary). Shared render: `lib/portal/summary.ts`
> `loadSummaryData()` + `components/portal/VisitSummaryDocument.tsx`.
>
> **WhatsApp number is live:** `+961 76 721 503` (`lib/site.ts`). **Domain** is
> still the Vercel default (`nursing-project-olive.vercel.app`) — swap `site.url`
> in `lib/site.ts` when a real domain is chosen.
>
> **Testing (the first test framework in the repo):**
> `npm test` → 14 Vitest + React Testing Library unit tests.
> `npm run test:rls` → **52 integration tests** against the **real** Supabase
> project, proving every Row-Level-Security rule: family isolation, nurse
> isolation, published-only family read, append-only audit, wound-photo
> isolation, nurse patient/case read. No Docker — runs against the cloud DB
> using keys from `.env.local`.
>
> **DB / migrations:** `supabase/migrations/` applied to the cloud project via
> `node scripts/db-query.mjs` (Supabase Management API; personal access token in
> gitignored `.supabase-token`). Migrations added this phase: `*_nurse_write.sql`
> (lifecycle + audit + RLS), `*_fix_audit_read_policy.sql`,
> `*_nurse_read_patient_case.sql`.
>
> **Specs/plans:** `docs/superpowers/specs/2026-05-30-nurse-write-portal-design.md`,
> `2026-05-31-family-read-view-design.md`, and the matching plans in
> `docs/superpowers/plans/`.
>
> **Auth model (invite-only):** One passwordless login (email magic link) for
> all roles. Role (`family`/`nurse`/`coordinator`) is stored on the account and
> read at `/portal`, which renders the matching home; coordinator pages redirect
> non-coordinators and RLS blocks the data regardless. Signup is **off** at both
> layers: `app/[locale]/login/actions.ts` uses `shouldCreateUser:false`, and the
> Supabase project has `disable_signup:true`. A non-invited email gets the same
> neutral "check your email" message but no link/account (anti-enumeration).
> Accounts are created only by the coordinator invite flow.
>
> **Known limitations / next steps (small):**
> - **Email delivery is restricted** until a domain is verified in Resend: the
>   sender is the shared `onboarding@resend.dev` test sender, which only delivers
>   to the project owner's own verified address (`theomarbadran@gmail.com`).
>   Other people will NOT receive a login email yet — this is why an outside
>   tester saw an error. Fix = verify a sending domain (tied to the domain
>   decision). Until then, add the person as a real user and hand them a
>   coordinator-generated one-time link (e.g. on WhatsApp).
> - Nurse-invite emails are **manual** — the coordinator sends the generated
>   magic link (e.g. on WhatsApp). Automatic email-on-invite needs a verified
>   sending domain (tied to the domain decision).
> - No notifications / email-on-publish, no PDF beyond the in-document print
>   button, no family commenting — all intentionally deferred (YAGNI).
> - Dev seed helpers for manual smoke testing live in `scripts/seed-smoke.mjs`
>   and `scripts/seed-family-smoke.mjs`; `scripts/mint-session-cookies.mjs` mints
>   a local session for browser testing. All clean up after themselves.
>
> ---

│   └── ar.json                 # Arabic copy (placeholders)
├── docs/
│   ├── HANDOFF.md              # this document
│   ├── SESSION-EXPORT-2026-05-19.md
│   └── superpowers/
│       ├── specs/2026-05-19-marketing-site-design.md
│       └── plans/2026-05-19-marketing-site-homepage-build.md
├── public/                     # static assets
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── CLAUDE.md                   # AI assistant context (used by Claude Code)
└── AGENTS.md
```

---

## 5. How to run it locally

A collaborator who clones this folder needs Node.js installed (version 18+ recommended). Then:

```bash
# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev

# Open in browser:
# http://localhost:3000/en  (English)
# http://localhost:3000/ar  (Arabic — placeholder copy)

# Production build (verifies everything compiles)
npm run build
```

The dev server uses Turbopack — hot-reloads on file changes.

---

## 6. What's NOT done yet

These are explicit deferrals, not oversights. Each was discussed and pushed to a follow-up phase:

### Marketing site (this branch)
- **Real WhatsApp Business number** — `lib/site.ts` has `+961 X XXX XXX` placeholder. Single-line swap when the real number is ready.
- **Real domain** — `lib/site.ts` has `https://example.com`. Update when the domain is chosen (`.com.lb` / `.co` / `.care` / a modifier are all still in play; `caregiverscol.com` is taken by a Florida operator).
- **Arabic translations** — `messages/ar.json` has placeholder Arabic. An Arabic editor needs to review before launch.
- **Mobile menu (hamburger)** — desktop nav collapses below 1024px width but there's no replacement nav for mobile. Marked as a follow-up task with a comment in `Topbar.tsx`.
- **Commissioned Beirut photography** — currently using Centre for Ageing Better + curated Unsplash photography. A half-day shoot with a local photographer is planned post-launch.
- **The other 6 pages** (`/services`, `/packages`, `/how-we-work`, `/diaspora`, `/faq`, `/for-nurses`, `/contact`) are placeholder-grade. They use the new Topbar + Footer but their content needs polishing in a follow-up plan, reusing the homepage section components.
- **Lighthouse + accessibility pass** — should be run on the Vercel preview before merging to main.

### Phase 2 (not started)
- Supabase backend (Postgres + Auth + Storage) for the family portal
- Row-Level Security on every patient-touching table (PHI compliance)
- Visit summary template, vetting checklist, escalation flow, photo consent form
- 3 blog posts (drafts in flight from a parallel conversation)
- Care-fit wizard on `/services`

---

## 7. Where to dig in if you want to edit something

| You want to change… | File to edit |
|---|---|
| Brand name, WhatsApp number, domain, districts, payment rails | `lib/site.ts` (single source of truth) |
| Homepage section copy (English) | `messages/en.json` under `home.*` |
| Arabic copy | `messages/ar.json` |
| Colors / palette | `app/globals.css` (the `@theme` block) |
| Fonts | `app/[locale]/layout.tsx` (Fontshare links) |
| Hero photo | `app/[locale]/page.tsx` (the `HERO_PHOTO` constant) |
| Section structure / order | `app/[locale]/page.tsx` |
| Individual section design | `components/home/{SectionName}.tsx` |
| Topbar nav | `components/Topbar.tsx` + `messages/en.json` `nav` block |
| Footer columns | `components/Footer.tsx` + `messages/en.json` `footer` block |

---

## 8. Design references (read first if making visual changes)

1. **The locked design spec** — `docs/superpowers/specs/2026-05-19-marketing-site-design.md`. Read sections 3 (visual direction), 5 (section-by-section detail), 8 (deferred items).
2. **The build plan** — `docs/superpowers/plans/2026-05-19-marketing-site-homepage-build.md`. Each task shows the exact code that was written for each component. Useful as a reference.
3. **The original mockup** — `.claude/worktrees/trusting-albattani-70717b/docs/external-design/design_handoff_caregivers_collective/Caregivers Collective.html`. The high-fidelity HTML that informed the design.

---

## 9. Git state at handoff

```
Branch:       feat/marketing-homepage
Commits ahead of master: 21
Build status: passing (Next.js 16 production build)
Working tree: clean
```

To see all changes the branch introduces:
```bash
git log master..HEAD --oneline
git diff master..HEAD --stat
```

---

## 10. Honest things to flag

- **WhatsApp variants** — `components/WhatsAppButton.tsx` uses inline CSS variables (`var(--color-paper)` etc.) for the button's resting colors instead of relying on Tailwind utility classes. This was a defensive fix after the user reported invisible button text. Hover states still use Tailwind classes; if hover contrast is reported broken, switch hover styling to React state too.
- **No production photography yet** — every photo on the homepage is an Unsplash placeholder. They look fine but they're not Caregivers Collective's own photography. Replace with commissioned Beirut shots when available.
- **Reduced-motion gotcha** — entrance animations on the hero use `animation-fill-mode: both` (not `forwards`) so that when `prefers-reduced-motion: reduce` kills the animation, elements fall back to visible (opacity:1). If you add more entrance animations elsewhere, follow the same pattern.
- **`@keyframes pulse` is renamed to `dot-pulse`** — to avoid colliding with Tailwind v4's built-in `animate-pulse` utility. Anywhere you want the pulsing dot effect, reference `animation: dot-pulse 2.4s ease-in-out infinite`.

---

## 11. How to share this project (instructions for the founder)

See the visual that opens in your browser. Three options ranked by what your friend wants to do.
