# Caregivers Collective — Marketing Site Design Spec

**Date:** 2026-05-19
**Supersedes:** `2026-05-06-marketing-site-polish-design.md` (visual direction was deferred there; locked here)
**Status:** Awaiting user approval before implementation plan

---

## 1. What this document is

The locked design recipe for the Caregivers Collective marketing homepage. Built on top of the original `Caregivers Collective.html` mockup (the "source-of-truth" design from the worktree), with specific edits driven by a sharper positioning decision: **this is a high-ticket service primarily marketed to the Lebanese diaspora.**

Every decision below was made in the 2026-05-19 working session with the user. If you're a developer or AI agent picking this up, you can build straight from this doc. The reasoning is included so future trade-offs can be made without re-litigating fundamentals.

---

## 2. Brand and audience

### Positioning (locked)

- **Service:** home nursing in Beirut and Mt. Lebanon — hospital-employed Lebanese RNs and PNs working their off-days; WhatsApp coordinator; written visit summary in the family portal the same day
- **Audience (primary):** Lebanese diaspora — adult children abroad with parents in Beirut. **Primary mental-model persona: a Lebanese daughter in Paris.** Secondary diaspora cities: Dubai, Detroit, London, Sydney.
- **Audience (secondary):** Beirut/Mt. Lebanon residents directly hiring care for a family member
- **Ticket size:** high. No discount language. No price displays. Quote-only via WhatsApp. Restraint reads as premium.
- **Emotional core:** *"Your parents are in Beirut. You're not."* Distance + worry + the desire to do right by family.

### Trust signals that matter to this audience

In order of weight on the homepage:

1. **Real Lebanese nurses, hospital-trained** — name the hospitals (AUBMC, Hôtel-Dieu, St Georges) explicitly
2. **Written summary in family portal every visit** — proof, accountability, distance-bridging
3. **Same-nurse continuity** — mom builds a relationship with one person, not a rotating cast
4. **Payment from abroad works** — Western Union, OMT International, Whish Money, USD wire
5. **Bilingual coordinator** — EN · AR · FR
6. **Lebanese Order of Nurses licensed**

### Voice

- Brand-as-entity. Never first-person ("I/we"). Never "founder." Never "agency." Never a personal name. (Employer-risk constraint — the founder is hospital-employed.)
- Plain, third-person, conversational. Permission-granting, not selling.
- Smart curly quotes (`"` `"` `'`). No straight quotes.
- Languages: EN · AR · FR (only EN copy locked in this design; AR/FR follow later)

### Forbidden moves

- AI-slop verbs ("elevate," "unleash," "next-gen")
- Stats-as-marketing-proof
- Generic "why us" 4-card grids
- Fake medical-software dashboard mockups
- "Founded by" / first-person bio anywhere

---

## 3. Visual direction

### 3.1 Palette (locked — the original CC palette stays)

```
--paper        #f7f7f3   warm off-white — main page background
--ink          #1f2a35   near-black — body text + dark sections
--ink-soft     #34474e   secondary body text
--rule         #dedfe1   borders on light backgrounds
--rule-warm    #d9d2c5   borders on warm backgrounds (cream cards)
--cream        #f3eee5   warm section background (services)
--paper-cool   #f1f2f4   cool section background (FAQ, trust)
--teal         #2f7a76   brand accent on light, link color, italic emphasis
--teal-deep    #1a504f   hover state, eyebrow text
--teal-soft    #dceee8   hover-state backgrounds
--signal       #4ec19a   bright teal-green on dark — dark CTAs, chart lines, italic on dark
--signal-deep  #2c8c70   hover of signal
--peach        #e8b58a   rare warm accent, italic on dark hero
--sand         #dcc99f   italic emphasis on dark sections
--night        #13202c   dark section background (hero, diaspora, final CTA)
--night-deep   #0d1822   deeper dark variant
```

All colors are OKLCH in source; hex equivalents shown above. Tailwind v4 `@theme` block in `app/globals.css` is the canonical source once ported.

### 3.2 Typography (locked)

Three families, all free, all hosted via Fontshare CDN.

| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Display (h1, h2, h3) | **Cabinet Grotesk** | 500, 700 | More editorial character than Geist; italic for emphasis |
| Body, UI, nav | **Switzer** | 300, 400, 500, 600 | Clean humanist sans, warmer companion |
| Small labels, eyebrows, captions | **Fragment Mono** | 400 | Mono character without the JetBrains-Mono AI-slop signal |

**Why this trio instead of Geist:** Geist reads as dev-tool / tech-startup typography. For a high-ticket healthcare brand, Cabinet Grotesk + Switzer feels more like an editorial publication or a premium service — closer to the brand the user wants.

**Type scale (responsive via `clamp`):**

| Element | Min | Vw | Max | Properties |
|---------|-----|-----|-----|------------|
| h1 (hero) | 38px | 7vw | 96px | Cabinet Grotesk 500, tracking -0.035em |
| h2 (section) | 32px | 4.5vw | 58px | Cabinet Grotesk 500, tracking -0.025em |
| h3 (card) | 19px | 1.8vw | 26px | Cabinet Grotesk 500, tracking -0.015em |
| body | 15px | — | 17px | Switzer 400, line-height 1.55 |
| lede | 16px | 1.2vw | 19px | Switzer 400, line-height 1.55 |
| eyebrow | — | — | 11px | Fragment Mono, tracking 0.18em, uppercase |
| label | — | — | 10.5px | Fragment Mono, tracking 0.16em, uppercase |

### 3.3 Photography

**Phase 1 (launch):** curated Unsplash mix, warm-tone color-graded to match palette.

- **Hero shot:** Centre for Ageing Better collection (locked previously) — older adult in a warm-light home setting. Specifically the photo at `photo-1658314755707-1fbdf7c40145` until a better one is found.
- **Service cards (5 photos):** clinical action shots — IV setup, BP cuff, wound care, blood draw, daily care. Sourced from Unsplash by search; verified to fit the warm/honest tone.
- **How-it-works step photos (3):** WhatsApp screen / nurse arrival / visit summary on paper.
- **Final CTA section:** warm intimate detail shot (hands, light, tea on a tray).

**Strict criteria for any photo on the site:**
- No face of the founder (employer-risk)
- No "stock-photo smiling old people" coding
- No clinical-blue lighting or hospital corridors
- Warm afternoon light preferred
- In-home environments, not studio
- Faces of caregivers / patients OK if the photo doesn't read as "fake stock"

**Phase 2 (post-launch):** commission real Beirut photography from a local photographer. One half-day shoot. Replaces Unsplash photos gradually. **Decision deferred** until first paying customers.

### 3.4 Motion

Restrained. Premium. Mobile-compatible. All gated by `prefers-reduced-motion`.

- **Hero Ken Burns slow zoom** — 30s alternating loop, scale 1.0 → 1.08
- **Scroll-triggered reveals** — opacity + 20px translateY → 0, over 720ms with cubic-bezier(.2,.7,.2,1)
- **WhatsApp dot pulse** — 2.4s ease-in-out infinite, scales 1.0 → 1.25 with opacity shift
- **Card hover lift** — translateY(-3px) + subtle shadow + border color shift, 220-280ms transitions
- **3D card tilt on `pointermove`** — desktop hover-capable only, max ±0.8deg rotateX, ±1.2deg rotateY
- **Live indicator pulse** on diaspora timezone tiles — same 2.4s pattern, brass-tinted
- **No GSAP** — IntersectionObserver + CSS transitions only. The original CC used GSAP; we drop it. Simpler build, mobile-safe, same visual outcome for what we keep.

**What we explicitly removed from the original:**
- The scrubbed text reveal layer (cinematic but heavy)
- The pinned visit dashboard sequence (cut along with the section)
- The cursor blob (theatrical, doesn't match the premium restraint goal)
- The 14 named GSAP scroll effects → reduced to the 5 above

---

## 4. Information architecture

The 9-route IA from the prior session stays:

```
/                   home — this design
/services           full 6-card services + WhatsApp CTA per card
/packages           three pricing modes (visit / shift / subscription)
/how-we-work        process detail
/diaspora           full payment rails + timezones + portal preview
/faq                accordion
/for-nurses         independent service-provider framing
/contact            WhatsApp-first
/blog               scaffold + 3 starter posts (not yet built)
```

Removed from IA: `/pricing`, `/partners`, `/investors`, `/team`, `/about`.

---

## 5. Homepage sections (9 sections, top to bottom)

This is the structural edit from the original (which had 13 sections). The 4 cuts and the reordering are the main delta.

### 5.1 Topbar (sticky)

- Position: `sticky top:0`, z-index 50, blur+saturate backdrop, 68px tall
- Background: `--paper` at 85% opacity with `backdrop-filter: saturate(140%) blur(14px)`
- Border-bottom: 1px solid 7%-opacity ink
- Left: brand mark (30×30 gradient teal→teal-deep with cream ring inside) + brand name in Cabinet Grotesk 700 + mono caption "Home nursing · est. 2026"
- Center: nav (Services / How it works / Diaspora / Packages / FAQ) — hidden below 880px
- Right: WhatsApp pill (navy background, cream text, pulsing peach dot)
- Mobile: hamburger replaces nav below 880px (drawer UI to be built with the codebase's component library)

### 5.2 Hero (dark, cinematic, photo-led)

**Variant locked:** text on photo, bottom-anchored block. (Was option 1 of 5 the user reviewed.)

- Full-bleed photo background (`--night` fallback), `min-height: 100vh`, padding-top 68px to clear topbar
- Photo: Ken Burns slow zoom (see 3.4), slight saturate + contrast
- Scrim: 4-stop linear gradient from `rgba(19,32,44,0.25)` at top → `rgba(19,32,44,0.92)` at bottom — keeps text readable while photo bleeds through
- Content anchored bottom-left, padding-bottom `clamp(48px, 9vh, 96px)`
  - **Badge**: Fragment Mono 11px, "Live · Beirut &amp; Mt. Lebanon" with pulsing peach dot
  - **H1**: Cabinet Grotesk 500, `clamp(38px, 7vw, 96px)`, max-width 18ch, italic emphasis in sand-peach. Example: *"Hospital-trained nurses, sent to the house."*
  - **Sub**: Switzer 400, `clamp(16px, 1.3vw, 19px)`, max-width 52ch, 85% cream. Example: *"Lebanese RNs and PNs working their hospital off-days. Coordinated by WhatsApp. A written summary in the family portal after every visit."*
  - **CTAs**: primary cream-bg "Message the coordinator →" + ghost cream-border "How a visit works"
- Bottom-right corner: tiny mono meta — "EN · AR · FR" / "Quote · WhatsApp" (hidden below 700px)
- **No pulse-card vitals dashboard.** That was the SaaS-coded slop signal in the original; it is permanently removed. The hero is one photo + one headline + two buttons.

Entrance animations: stagger fade-up on badge, h1, sub, CTAs over 1.1s with 0.3s start delay.

### 5.3 Trust bar (light strip)

- Background: `--paper-cool`, 22px vertical padding, border-bottom on both edges
- Single centered row of Fragment Mono uppercase labels separated by 4px teal dots:
  - "Beirut & Mount Lebanon"
  - "Hospital-trained · AUBMC · Hôtel-Dieu · St Georges"
  - "Lebanese Order of Nurses"
  - "Written summary every visit"
- Wraps on mobile; dots hidden below 700px

### 5.4 For families abroad (dark, **moved to position 4 — the emotional anchor**)

This section was buried deep in the original. It now sits high on the page because the audience is diaspora-first.

- Background: `--night`, padding `clamp(72px, 12vw, 140px) 0`, top-right signal-teal radial glow
- Two-column grid (1fr 1fr, gap 80px):
  - **Left:**
    - Eyebrow: "For families abroad" (Fragment Mono, sand color)
    - H2: *"Your parents are in Beirut. **You're not.**"* (Cabinet Grotesk 500, italic "You're not" in sand)
    - Lead: *"Pay from Paris. Read the visit summary in Dubai. Approve the next visit from London. The portal works in three timezones at once."*
  - **Right:**
    - 4 timezone tiles (Beirut · Paris · Dubai · Detroit) in a 4-column grid — live clocks (Cabinet Grotesk 500, 24px)
    - Below: payment rails strip — Whish Money / OMT International / Western Union / USD wire — Fragment Mono labels with teal dots
- Mobile: stacks to single column, timezones become 2×2 grid

### 5.5 Services (warm, photo cards)

- Background: `--cream`, top + bottom warm rules
- Section head: eyebrow + headline ("Care that comes *to the door.*") + lede
- Grid: `1.4fr 1fr 1fr` desktop (1 featured card spans 2 rows + 4 small + 1 dark catch-all). Collapses to 2-col at 920px, 1-col at 560px.
- Each card: white background, warm border, 18px radius
  - 4:3 photo at top with mono caption corner ("Nurse · IV setup · bedside")
  - Body padding 22-24px
  - Mono label in teal-deep (e.g., "01 · Clinical visits")
  - h3 Cabinet Grotesk 500, max 16ch
  - One paragraph of plain copy
  - Border-top divider with teal "Discuss your case →" link + "Quote-only" mono caption
- **Dark catch-all card** (last position): "Outside this list? — Not every case fits a category. Message the coordinator." → opens WhatsApp.

Service categories (5 + catch-all):
1. **Clinical visits** (featured, spans 2 rows) — IM/SubQ injection, IV start, hydration, Foley, complex wound care
2. **Recovery at home** — post-surgical, drain, dressing, mobility
3. **Daily care** — bath, meds, vitals, 8/12/24-hour blocks
4. **Bloodwork at home** — routine, fasting, same-day
5. **Overnight & companion** — 8/12/24-hour shifts
6. **Outside this list?** (dark catch-all)

### 5.6 How a visit works (light, asymmetric story)

- Background: `--paper-soft`
- Section head: eyebrow + "Three moments. *Same hand.*" + lede
- Three numbered steps, asymmetric image+text alternation (image left/right alternates):
  - **01** WhatsApp · "Message us — in your own words." (photo: WhatsApp screen with coordinator typing)
  - **02** Visit · "A licensed nurse arrives — matched to the case." (photo: nurse at doorway)
  - **03** Summary · "A written summary, the same day, in the family portal." (photo: visit notes on a kitchen table)
- Big numerals in `--teal-deep`, 100px Cabinet Grotesk 700 with -0.04em tracking
- Step 3's photo doubles as the portal-preview signal — replaces the cut "typical visit dashboard" section. The visitor sees what they receive without us building a fake tabbed UI.

### 5.7 Service area (light)

- Section head: eyebrow + "Where we visit." + lede
- 6-column grid of district cells (3 col at 1000px, 2 col at 480px)
- Each cell: district name (Switzer 500, 15px) + Fragment Mono "Active" with leading teal dot
- 17 districts: Achrafieh, Hamra, Verdun, Badaro, Mar Mikhael, Gemmayzeh, Sin El Fil, Mansourieh, Baabda, Jal El Dib, Antelias, Jounieh, Broumana, Beit Mery, Dbayeh, Bauchrieh, Furn el Chebbak
- Plus one `.off` cell: "Off-map?" with muted gray dot
- Hover: teal border + teal-soft fill
- Below the grid: teal-soft `Note` callout with pin icon: *"Off-map district? Message the coordinator anyway — most off-map cases find a fit."* + primary CTA button

### 5.8 FAQ (cool light)

- Background: `--paper-cool`, 2-col wrap (0.85fr 1.15fr)
- Left: eyebrow + h2 + lede + small "Still have a question?" helper card with WhatsApp CTA
- Right: native `<details>`/`<summary>` accordion. Each summary has a 28px `.plus` button that rotates 45° + becomes teal when open. One item open by default ("Why don't you publish prices?").

**Q&A (verbatim source — 8 items, diaspora-first ordering):**

1. *Why don't you publish prices?* — High-touch service. Every case has a different shape. We quote on WhatsApp after a short conversation.
2. *How does payment from abroad work?* — Western Union, OMT International, Whish Money, or direct USD wire. The coordinator sends you a summary of what's billed and how to pay in your timezone.
3. *Can I read the visit summary in Arabic?* — Yes. The portal has EN, AR, FR. The summary is written in the language the coordinator and you agreed on.
4. *What if it's 3am where I am?* — The coordinator replies in your daytime. The portal is always available. Emergencies still get same-day response in Beirut time.
5. *How are the nurses vetted?* — Lebanese Order of Nurses licensed, currently employed at AUBMC, Hôtel-Dieu, or St Georges. Off-day shifts only. Background-checked.
6. *Can I keep the same nurse week to week?* — Yes, when the case is ongoing. Same-nurse continuity is the default for daily care and recovery cases.
7. *What ends up in the family portal?* — Vitals, what was done that visit, what to watch for, next visit date. Wound photos in a private bucket if applicable.
8. *What's not offered yet?* — Live-in care, NG tube, ICU/tracheostomy specialty, Holter, oxygen rental. (Coming later.)

### 5.9 Final CTA + footer (dark)

- Background: `--night`, two radial glows (peach bottom-left at 30%, signal-teal top-right at 50%)
- 2-col `.final-grid`:
  - **Left:** eyebrow "When you're ready" + huge h2 *"The first message is **always free.**"* (italic emphasis in signal-teal) + lede + two CTAs (primary signal-teal "WhatsApp the coordinator →" + ghost cream-border "Call +961 …")
  - **Right:** glass `.contact-card` (24px padding) listing WhatsApp, Email, Coordinator hours, Languages
- Footer below: 4-column (brand col is 2x) — brand mark + blurb + © line + Care / Families / Contact link columns

---

## 6. Components to build

These are the React components the Next.js port will need. Most are 1:1 with a section. Shared components are noted.

| Component | Used in | Notes |
|-----------|---------|-------|
| `<Topbar>` | every page | sticky, blur, brand mark, nav, WhatsApp pill |
| `<Hero>` | home, /services, /how-we-work, /diaspora | accepts photo URL, eyebrow, headline, sub, CTAs as props |
| `<TrustBar>` | home, /services | mono-uppercase chips with dots |
| `<DiasporaSection>` | home, /diaspora | dark, with timezone tiles + payment rails |
| `<TimezoneTile>` | inside DiasporaSection | live clock, city label |
| `<PaymentRail>` | inside DiasporaSection, /diaspora | row item with label + dot |
| `<ServicesGrid>` | home, /services | featured + N + dark catch-all |
| `<ServiceCard>` | inside ServicesGrid | photo + label + h3 + copy + footer link |
| `<HowItWorks>` | home, /how-we-work | asymmetric step alternation |
| `<Step>` | inside HowItWorks | big numeral + h3 + paragraph + photo |
| `<DistrictGrid>` | home, /services | 6-col responsive grid |
| `<DistrictCell>` | inside DistrictGrid | name + mono status + dot |
| `<FAQ>` | home, /faq | `<details>` accordion with rotating plus button |
| `<FinalCTA>` | home, /contact | dark section with contact card |
| `<Footer>` | every page | 4-column with link columns |
| `<RevealOnScroll>` | wrapper | IntersectionObserver fade-up helper |
| `<KenBurnsPhoto>` | hero | image with CSS animation |
| `<WhatsAppButton>` | many | shared CTA pill with pulsing dot |

---

## 7. Build approach

### Existing code reuse

The project already has 7 placeholder pages in `app/[locale]/*.tsx` with bilingual EN/AR copy in `messages/en.json` and `messages/ar.json`. Phase 1 reuses the routing structure and copy infrastructure; only the visual components are new.

### Steps (high level — detailed plan comes from `writing-plans` skill next)

1. **Port the OKLCH palette to Tailwind v4 `@theme` block** in `app/globals.css`. All colors become Tailwind utilities (`bg-paper`, `text-ink`, `border-teal`, etc.)
2. **Add Fontshare links** to `app/layout.tsx` for Cabinet Grotesk + Switzer + Fragment Mono. Set up Tailwind font families.
3. **Build shared components first** — Topbar, Footer, RevealOnScroll, WhatsAppButton, KenBurnsPhoto
4. **Build homepage section components in order** — Hero, TrustBar, DiasporaSection, ServicesGrid, HowItWorks, DistrictGrid, FAQ, FinalCTA
5. **Wire them into `app/[locale]/page.tsx`** as the homepage
6. **Polish the other 6 placeholder pages** using the same components
7. **Mobile QA pass** at 360, 560, 820, 1080 widths
8. **Lighthouse + a11y pass** before launch

### What stays from the existing code

- `lib/site.ts` — brand identity helpers (WhatsApp URL, languages, etc.)
- `messages/en.json` and `messages/ar.json` — copy structure
- `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`
- Existing route stubs in `app/[locale]/*.tsx`

### What gets rewritten

- All component files in `components/` — they were placeholder; rebuild from this design
- `app/globals.css` — replace with Tailwind v4 `@theme` matching the locked palette
- Hero, services grid, how-it-works, diaspora, FAQ, final CTA sections

---

## 8. Deferred decisions

Items the user explicitly deferred or has not yet decided. Do not pin these without checking back.

- **Domain:** `.com.lb` / `.co` / `.care` / `thecaregiverscollective.com` / `caregiverscollectivebeirut.com` — not picked. Affects social-share OG tags and email-from address eventually.
- **WhatsApp Business number:** still placeholder `+961 X XXX XXX` in `lib/site.ts`. Single-line swap when ready.
- **Phase 2 photography commission:** local Beirut photographer engagement. Defer until first paying customers.
- **Real visit summary template** — used inside step 3 of "How a visit works" and on the eventual `/what-we-send` page. Drafts coming from parallel conversation.
- **Care-fit wizard** on `/services` — 3-question decision tree → pre-filled WhatsApp message. Not yet built.
- **Brand mark refinement** — current mark is a CSS-built gradient square with ring + dot. Provisional until graphic designer signs off.
- **Arabic editor engagement** — locked for end of Phase 2. AR translation of all copy.
- **`/blog` content** — 3 starter posts in flight from parallel conversation.

---

## 9. Source-of-truth references

| Document | Path | Purpose |
|----------|------|---------|
| Original design HTML | `.claude/worktrees/trusting-albattani-70717b/docs/external-design/design_handoff_caregivers_collective/Caregivers Collective.html` | The mockup this design edits |
| Original design README | same dir, `README.md` | Section specs and design tokens (22KB) |
| Prior resume doc | `.claude/worktrees/trusting-albattani-70717b/docs/RESUME-2026-05-13.md` | Project state at start of design exploration |
| Prior spec (superseded) | `docs/superpowers/specs/2026-05-06-marketing-site-polish-design.md` | Phase 0 polish spec — visual direction deferred there, locked here |
| Session export | `docs/SESSION-EXPORT-2026-05-19.md` | Briefing for Claude Chat collaborator |
| Working files (gitignored) | `.superpowers/brainstorm/308-1779183088/content/` | Hero variants, palette options, status boards, decision pages used in this session |

---

## 10. What's NOT in this doc

- Database schemas, RLS policies (Phase 2 territory)
- AR/FR translated copy (locked structurally, content follows)
- Real visit summary template (drafts coming separately)
- Implementation plan with tasks, file paths, dependencies — that's the next deliverable from `superpowers:writing-plans`

---

**Approval gate:** the user should read this and either approve, or list edits. After approval, the next step is the implementation plan.
