# Caregivers Collective — Project Handoff

**Date:** 2026-05-19
**For:** A collaborator joining the project to look at it, edit it, or both.

---

## 1. What this project is

**Caregivers Collective** is a home-nursing coordination platform for Beirut & Mount Lebanon. The site coordinates licensed Lebanese RNs and PNs (working their hospital off-days) for home visits, with a written summary in a family portal after each visit. Booking happens on WhatsApp; pricing is quote-only.

**Primary audience:** the Lebanese diaspora — adult children abroad (Paris first, then Dubai, Detroit, London) with aging parents in Beirut. The marketing site speaks to that person first.

**Positioning:** high-ticket service. No discount language. Restraint reads as premium.

---

## 2. What's been built

### Phase 1: Marketing-site homepage (this session, 2026-05-19)

A full visual redesign of the homepage was completed today. **21 commits** on the branch `feat/marketing-homepage`. The homepage is live at `http://localhost:3000/en` when the dev server is running.

**Tech stack:**
- Next.js 16.2.4 (App Router) + React 19
- Tailwind CSS v4 (CSS-first config via `@theme` block in `app/globals.css`)
- TypeScript
- Three Fontshare-hosted fonts: Cabinet Grotesk (display), Switzer (body), Fragment Mono (small labels)
- Internationalisation: EN + AR (with AR copy as placeholders; Arabic editor engagement planned for Phase 2)
- No test framework yet — manual visual QA + `npm run build` is the gate; heavier testing comes in Phase 2

**Homepage sections (in order):**
1. **Topbar** — sticky, frosted-glass, brand mark + nav + WhatsApp pill (mobile menu deferred)
2. **Hero** — full-bleed photo with text overlay, slow Ken Burns zoom, entrance stagger animations
3. **Trust bar** — hospital names (AUBMC · Hôtel-Dieu · St Georges) + license + summary signals
4. **For families abroad** *(diaspora section — moved high up as emotional anchor)* — dark navy, live timezone tiles (Beirut · Paris · Dubai · Detroit), payment rails (Whish Money / OMT International / Western Union / USD wire)
5. **Services** — asymmetric grid: 1 featured card + 4 regular cards + 1 dark "Outside this list?" catch-all
6. **How a visit works** — three numbered steps with alternating image/text layout (01 message us, 02 nurse arrives, 03 written summary)
7. **Service area** — 17 districts in Beirut + Mt. Lebanon, hover-teal cells, off-map callout
8. **FAQ** — native `<details>` accordion with 8 diaspora-first Q&A items (payment from abroad, Arabic summaries, 3am timezones, etc.)
9. **Final CTA + footer** — dark night background with radial glows, "The first message is always free."

### What sat behind the design

A full design spec was written and approved before any code was touched: `docs/superpowers/specs/2026-05-19-marketing-site-design.md` (locks palette, typography, motion vocabulary, section-by-section structure). The implementation plan with all 21 build tasks lives at `docs/superpowers/plans/2026-05-19-marketing-site-homepage-build.md`.

---

## 3. The 21-commit build trail

```
ca944a4  chore(brand): rename HomeCare Lebanon -> Caregivers Collective, add diaspora data
1a91014  feat(theme): port OKLCH palette + motion helpers to Tailwind v4 @theme
c101ad8  fix(theme): move layout vars to :root, drop redundant reset, rename pulse->dot-pulse
e441e6c  feat(fonts): swap Geist for Cabinet Grotesk + Switzer + Fragment Mono via Fontshare
e41d75c  feat(components): add RevealOnScroll IntersectionObserver helper
1ac09a2  feat(components): add KenBurnsPhoto CSS-animated photo helper
6c4d8be  feat(components): add WhatsAppButton shared CTA with variants
15c4672  feat(topbar): replace Navbar with Topbar matching design spec
26a8a16  fix(topbar): add aria-label, localize WhatsApp label, document mobile-menu deferral
12a6690  feat(footer): rebuild Footer with 4-column layout per spec
f3b2a0f  feat(hero): build text-on-photo Hero matching spec section 5.2
d19bfa8  fix(hero): use --night scrim color and add entrance stagger animations per spec
9e43c4d  feat(trust-bar): add TrustBar with hospital names + license + summary signals
2e337f6  feat(diaspora): add DiasporaSection with live timezone tiles + payment rails
5787574  feat(services): rebuild ServicesGrid with featured + dark catch-all card
873aa5a  feat(how-it-works): rebuild with alternating image+text Step components
038a369  feat(service-area): rebuild DistrictGrid with 17 districts + off-map callout
f9c93b0  feat(faq): add native-details FAQ accordion with 8 diaspora-first Q&A
9ef5faa  feat(final-cta): rebuild FinalCTA with dark glow + WhatsApp + call buttons
21aa763  feat(homepage): wire all 9 sections into [locale]/page.tsx
fd3b32b  chore: remove unused homepage components + rename HeroNew→Hero
099398e  fix(hero+whatsapp): text-on-photo visible with reduced-motion + ensure WhatsApp button contrast
```

---

## 4. File map

```
New proj/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # Fontshare links, Topbar + Footer wrapper
│   │   ├── page.tsx            # Homepage — wires the 9 sections in order
│   │   ├── services/page.tsx   # placeholder pages (will be polished in follow-up)
│   │   ├── packages/page.tsx
│   │   ├── how-we-work/page.tsx
│   │   ├── faq/page.tsx
│   │   ├── for-nurses/page.tsx
│   │   └── contact/page.tsx
│   ├── globals.css             # Tailwind v4 @theme + palette + animations
│   ├── opengraph-image.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── Topbar.tsx              # sticky nav (replaced old Navbar)
│   ├── Footer.tsx              # 4-column footer
│   ├── WhatsAppButton.tsx      # shared CTA pill, 3 variants
│   ├── KenBurnsPhoto.tsx       # slow-zoom photo helper for hero
│   ├── RevealOnScroll.tsx      # IntersectionObserver fade-up helper
│   └── home/
│       ├── Hero.tsx
│       ├── TrustBar.tsx
│       ├── DiasporaSection.tsx
│       ├── TimezoneTile.tsx    # live clock (client component)
│       ├── ServicesGrid.tsx
│       ├── ServiceCard.tsx
│       ├── HowItWorks.tsx
│       ├── Step.tsx
│       ├── ServiceArea.tsx     # district grid
│       ├── FAQ.tsx             # native <details> accordion
│       ├── CTABanner.tsx       # final CTA (named for legacy import)
│       └── contact/ContactForm.tsx
├── lib/
│   ├── site.ts                 # SINGLE SOURCE OF TRUTH for brand, districts, diaspora, payment rails, WhatsApp number
│   └── i18n.ts                 # locale + dictionary helpers
├── messages/
│   ├── en.json                 # English copy
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
