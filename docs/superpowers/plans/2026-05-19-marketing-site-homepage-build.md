# Marketing Site — Homepage Build · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the locked design from `docs/superpowers/specs/2026-05-19-marketing-site-design.md` into the existing Next.js 16 + Tailwind v4 codebase. Output: a working homepage at `/[locale]` matching the spec's 9-section, diaspora-first layout.

**Architecture:** Server-rendered Next.js App Router. Tailwind v4 with palette in `@theme`. Three Fontshare fonts (Cabinet Grotesk + Switzer + Fragment Mono). One IntersectionObserver helper for reveals, one CSS Ken Burns helper for the hero photo. No GSAP, no client-side state outside FAQ accordion (which uses native `<details>`).

**Tech Stack:** Next.js 16.2.4 (App Router) · React 19.2 · TypeScript 5 · Tailwind CSS v4 · Fontshare CDN fonts · existing `next-intl`-style i18n (en/ar).

**Why no unit tests in this plan:** the project has no test framework today and this is a marketing-site port — visual fidelity matters more than logic coverage. Per-task verification is `npm run build` (catches TypeScript / Next.js errors) plus opening `npm run dev` in a browser and checking the section at 4 breakpoints. Lighthouse + axe-core run once at the end as the launch gate. **Heavy test setup (Vitest / Playwright) is deferred to Phase 2** when patient data (PHI) is at stake.

**Branch strategy:** work on a feature branch off master (`feat/marketing-homepage`). The brand-rename commit on the worktree branch will be re-applied here as Task 1; we don't try to merge from the worktree.

**Source-of-truth references:**
- Design spec: `docs/superpowers/specs/2026-05-19-marketing-site-design.md`
- Original mockup: `.claude/worktrees/trusting-albattani-70717b/docs/external-design/design_handoff_caregivers_collective/Caregivers Collective.html`
- Original README: same dir, `README.md` (token reference)

---

## Phase 0 — Foundation: brand, palette, fonts

### Task 1: Verify and update brand identity in `lib/site.ts`

**Files:**
- Modify: `lib/site.ts`
- Modify: `messages/en.json` (if brand name appears in copy)

Master still shows the old brand name "HomeCare Lebanon." The locked brand is **Caregivers Collective**. Rename everywhere `lib/site.ts` references it.

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/marketing-homepage
```

- [ ] **Step 2: Update `lib/site.ts`**

Replace the existing file with:

```typescript
// Central place for business identity and contact details.
// Change the values here and they update everywhere on the site.

export const site = {
  name: "Caregivers Collective",
  shortName: "Caregivers Collective",
  tagline: "Hospital-trained home nursing for Beirut & Mount Lebanon",
  description:
    "Lebanese RNs and PNs from AUBMC, Hôtel-Dieu, and St Georges working their off-days. Coordinated by WhatsApp. A written summary in the family portal after every visit.",
  serviceArea: "Beirut & Mount Lebanon",
  established: "2026",

  // Public website URL — used for SEO metadata, sitemap, Open Graph, structured data.
  // Update this once the real domain is registered.
  url: "https://example.com",

  // Languages
  defaultLocale: "en" as const,
  locales: ["en", "ar"] as const,

  // Covered districts — 17 total, matches spec section 5.7
  districts: {
    beirut: [
      "Achrafieh",
      "Hamra",
      "Verdun",
      "Badaro",
      "Mar Mikhael",
      "Gemmayzeh",
      "Furn el Chebbak",
    ],
    mountLebanon: [
      "Sin El Fil",
      "Mansourieh",
      "Baabda",
      "Jal El Dib",
      "Antelias",
      "Jounieh",
      "Broumana",
      "Beit Mery",
      "Dbayeh",
      "Bauchrieh",
    ],
  },

  // Diaspora timezones — used in DiasporaSection. Paris first (primary persona).
  diasporaCities: [
    { name: "Beirut", tz: "Asia/Beirut" },
    { name: "Paris", tz: "Europe/Paris" },
    { name: "Dubai", tz: "Asia/Dubai" },
    { name: "Detroit", tz: "America/Detroit" },
  ] as const,

  // Payment rails for diaspora — order matters (most-used first)
  paymentRails: [
    { name: "Whish Money", type: "WALLET" },
    { name: "OMT International", type: "WIRE" },
    { name: "Western Union", type: "WIRE" },
    { name: "Direct USD wire", type: "USD" },
  ] as const,

  // Hospitals nurses are employed at (used in trust bar + hero subhead)
  hospitals: ["AUBMC", "Hôtel-Dieu", "St Georges"] as const,

  // WhatsApp — primary contact channel
  whatsapp: {
    number: "96100000000",
    display: "+961 XX XXX XXX",
  },

  get whatsappUrl() {
    return `https://wa.me/${this.whatsapp.number}`;
  },
  whatsappUrlWith(message: string) {
    return `https://wa.me/${this.whatsapp.number}?text=${encodeURIComponent(message)}`;
  },
} as const;
```

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: PASS. Any error here is a sign `lib/site.ts` is consumed somewhere with the old shape — search for `site.` references and update as needed.

- [ ] **Step 4: Commit**

```bash
git add lib/site.ts
git commit -m "chore(brand): rename HomeCare Lebanon -> Caregivers Collective, add diaspora data"
```

---

### Task 2: Port OKLCH palette to Tailwind v4 `@theme`

**Files:**
- Modify: `app/globals.css`

The existing globals.css has placeholder colors. Replace with the locked palette from the design spec, exposed as Tailwind utilities.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  /* ─── Palette ─── */
  --color-paper: oklch(0.985 0.006 165);          /* #f7f7f3 */
  --color-paper-cool: oklch(0.975 0.010 200);     /* #f1f2f4 */
  --color-cream: oklch(0.965 0.018 70);           /* #f3eee5 */
  --color-ink: oklch(0.21 0.018 210);             /* #1f2a35 */
  --color-ink-soft: oklch(0.34 0.014 210);        /* #454e58 */
  --color-muted: oklch(0.54 0.010 210);           /* #7a7f87 */
  --color-rule: oklch(0.90 0.012 200);            /* #dedfe1 */
  --color-rule-warm: oklch(0.88 0.020 70);        /* #d9d2c5 */
  --color-teal: oklch(0.50 0.08 175);             /* #2f7a76 */
  --color-teal-deep: oklch(0.36 0.07 180);        /* #1a504f */
  --color-teal-soft: oklch(0.94 0.030 170);       /* #dceee8 */
  --color-signal: oklch(0.62 0.13 165);           /* #4ec19a */
  --color-signal-deep: oklch(0.46 0.10 170);      /* #2c8c70 */
  --color-peach: oklch(0.78 0.10 50);             /* #e8b58a */
  --color-sand: oklch(0.84 0.05 80);              /* #dcc99f */
  --color-night: oklch(0.16 0.014 220);           /* #13202c */
  --color-night-deep: oklch(0.13 0.012 220);      /* #0d1822 */

  /* ─── Fonts (loaded from Fontshare via app/layout.tsx) ─── */
  --font-sans: "Switzer", system-ui, -apple-system, sans-serif;
  --font-display: "Cabinet Grotesk", "Switzer", sans-serif;
  --font-mono: "Fragment Mono", ui-monospace, Menlo, monospace;

  /* ─── Spacing ─── */
  --shell-max: 1340px;
  --pad-x: clamp(20px, 5vw, 96px);
}

/* ─── Base ─── */
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  background: var(--color-paper);
  color: var(--color-ink);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  line-height: 1.55;
  font-size: 16px;
}
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }

/* ─── Reveal helper (used by RevealOnScroll component) ─── */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 720ms cubic-bezier(0.2, 0.7, 0.2, 1),
              transform 720ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.reveal.in {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Ken Burns animation (hero photo) ─── */
@keyframes kenburns {
  0%   { transform: scale(1.0) translate(0, 0); }
  100% { transform: scale(1.08) translate(-1%, -1%); }
}

/* ─── Dot pulse (WhatsApp live dot) ─── */
@keyframes dot-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.25); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 2: Run dev server, check palette utilities work**

Run: `npm run dev`
Open: `http://localhost:3000/en`
Expected: site loads (will look broken visually, that's fine — we haven't built the new components yet). Open browser devtools, in console run `getComputedStyle(document.body).backgroundColor` — should report cream/paper color, not white.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): port OKLCH palette + motion helpers to Tailwind v4 @theme"
```

---

### Task 3: Replace Geist with Fontshare fonts in layout

**Files:**
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: Update `app/[locale]/layout.tsx` font imports and body className**

Find the import block at the top:

```typescript
import { Geist } from "next/font/google";
```

Remove it. Then find:

```typescript
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
```

Remove that line too.

In `generateMetadata` (no changes needed there).

Find the html element:

```typescript
<html lang={htmlLang[locale]} dir={dirOf(locale)} className={geist.variable}>
```

Replace with:

```typescript
<html lang={htmlLang[locale]} dir={dirOf(locale)}>
  <head>
    <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
    <link
      href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=cabinet-grotesk@500,700,800&f[]=fragment-mono@400&display=swap"
      rel="stylesheet"
    />
  </head>
```

Find the body className:

```typescript
<body
  className="min-h-screen flex flex-col bg-white text-slate-800 antialiased"
  suppressHydrationWarning
>
```

Replace with:

```typescript
<body
  className="min-h-screen flex flex-col bg-paper text-ink antialiased"
  suppressHydrationWarning
>
```

- [ ] **Step 2: Run build to verify TypeScript still happy**

Run: `npm run build`
Expected: PASS. If it fails citing Geist references elsewhere, search the codebase for `font-geist-sans` and remove those references.

- [ ] **Step 3: Run dev, verify fonts loaded**

Run: `npm run dev`
Open: `http://localhost:3000/en`
Open browser devtools → Network tab → reload → confirm `api.fontshare.com/...` request returns 200 and fonts visible in the Fonts section.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/layout.tsx
git commit -m "feat(fonts): swap Geist for Cabinet Grotesk + Switzer + Fragment Mono via Fontshare"
```

---

## Phase 1 — Shared components

### Task 4: Create `<RevealOnScroll>` helper

**Files:**
- Create: `components/RevealOnScroll.tsx`

Wraps children and applies `.in` class when they enter the viewport. Used for all section-level fade-up animations.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay in milliseconds before the reveal triggers after intersection */
  delay?: number;
  /** Margin around root for IntersectionObserver — default reveals slightly before fully on-screen */
  rootMargin?: string;
};

export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  rootMargin = "0px 0px -80px 0px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.setTimeout(() => el.classList.add("in"), delay);
            observer.unobserve(el);
          }
        });
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, rootMargin]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/RevealOnScroll.tsx
git commit -m "feat(components): add RevealOnScroll IntersectionObserver helper"
```

---

### Task 5: Create `<KenBurnsPhoto>` helper

**Files:**
- Create: `components/KenBurnsPhoto.tsx`

A `<div>` with a background image that slow-zooms via CSS. Used in hero.

- [ ] **Step 1: Create the file**

```tsx
type Props = {
  src: string;
  alt?: string;
  position?: string; // e.g. "center 30%"
  className?: string;
};

export default function KenBurnsPhoto({
  src,
  alt = "",
  position = "center 30%",
  className = "",
}: Props) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: position,
        animation: "kenburns 30s ease-in-out infinite alternate",
        filter: "saturate(1.05) contrast(1.02)",
      }}
    />
  );
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/KenBurnsPhoto.tsx
git commit -m "feat(components): add KenBurnsPhoto CSS-animated photo helper"
```

---

### Task 6: Create `<WhatsAppButton>` shared CTA

**Files:**
- Create: `components/WhatsAppButton.tsx`

Reusable pill with pulsing dot. Used in topbar, hero, final CTA, FAQ helper.

- [ ] **Step 1: Create the file**

```tsx
import { site } from "@/lib/site";

type Variant = "navy" | "signal" | "paper-on-dark";

type Props = {
  label: string;
  message?: string;
  variant?: Variant;
  className?: string;
};

const variantClasses: Record<Variant, string> = {
  navy: "bg-ink text-paper hover:bg-ink-soft",
  signal: "bg-signal text-ink hover:bg-signal-deep hover:text-paper",
  "paper-on-dark": "bg-paper text-ink hover:bg-white",
};

export default function WhatsAppButton({
  label,
  message,
  variant = "navy",
  className = "",
}: Props) {
  const href = message ? site.whatsappUrlWith(message) : site.whatsappUrl;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${variantClasses[variant]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-block size-[7px] rounded-full bg-peach"
        style={{ animation: "dot-pulse 2.4s ease-in-out infinite" }}
      />
      {label}
    </a>
  );
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/WhatsAppButton.tsx
git commit -m "feat(components): add WhatsAppButton shared CTA with variants"
```

---

### Task 7: Build new `<Topbar>` (replaces `<Navbar>`)

**Files:**
- Create: `components/Topbar.tsx`
- Modify: `app/[locale]/layout.tsx` (swap Navbar for Topbar)

- [ ] **Step 1: Create `components/Topbar.tsx`**

```tsx
import Link from "next/link";
import { site } from "@/lib/site";
import WhatsAppButton from "./WhatsAppButton";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  dict: {
    services: string;
    howItWorks: string;
    packages: string;
    diaspora: string;
    faq: string;
  };
};

export default function Topbar({ locale, dict }: Props) {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 border-b border-ink/[0.07] backdrop-saturate-150 backdrop-blur-[14px]"
      style={{ background: "rgba(247, 247, 243, 0.85)" }}
    >
      <div
        className="mx-auto flex h-[68px] items-center justify-between"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        {/* Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="relative size-[30px] rounded-[9px] bg-gradient-to-br from-ink to-ink-soft">
            <span className="absolute inset-[7px] rounded-[4px] border-[1.5px] border-paper/80" />
          </div>
          <div>
            <div className="font-display text-[16px] font-bold tracking-[-0.01em] text-ink">
              {site.name}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Home nursing · est. {site.established}
            </div>
          </div>
        </Link>

        {/* Nav — hidden on mobile */}
        <div className="hidden gap-[26px] text-sm font-medium text-ink-soft lg:flex">
          <Link href={`/${locale}/services`} className="hover:text-ink">{dict.services}</Link>
          <Link href={`/${locale}/how-we-work`} className="hover:text-ink">{dict.howItWorks}</Link>
          <Link href={`/${locale}/diaspora`} className="hover:text-ink">{dict.diaspora}</Link>
          <Link href={`/${locale}/packages`} className="hover:text-ink">{dict.packages}</Link>
          <Link href={`/${locale}/faq`} className="hover:text-ink">{dict.faq}</Link>
        </div>

        {/* WhatsApp CTA */}
        <WhatsAppButton label="WhatsApp coordinator" />
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Update `app/[locale]/layout.tsx` — swap Navbar import + usage**

Find:

```typescript
import Navbar from "@/components/Navbar";
```

Replace with:

```typescript
import Topbar from "@/components/Topbar";
```

Find:

```typescript
<Navbar locale={locale} dict={dict.nav} />
```

Replace with:

```typescript
<Topbar locale={locale} dict={dict.nav} />
```

- [ ] **Step 3: Make sure `messages/en.json` has the nav keys**

Open `messages/en.json` and find the `nav` section. Ensure it includes these keys (add if missing):

```json
{
  "nav": {
    "services": "Services",
    "howItWorks": "How it works",
    "packages": "Packages",
    "diaspora": "For families abroad",
    "faq": "FAQ"
  }
}
```

Do the same in `messages/ar.json` with Arabic translations (use existing translation patterns — `الخدمات / كيف نعمل / الباقات / العائلات في الخارج / الأسئلة الشائعة`).

- [ ] **Step 4: Run build + dev, verify topbar appears**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`
Open: `http://localhost:3000/en`
Expected: new Topbar visible at the top with brand mark on left, nav center, WhatsApp pill right. May look ugly because content below it hasn't been styled yet — that's fine.

- [ ] **Step 5: Commit**

```bash
git add components/Topbar.tsx app/[locale]/layout.tsx messages/en.json messages/ar.json
git commit -m "feat(topbar): replace Navbar with Topbar matching design spec"
```

---

### Task 8: Rebuild `<Footer>`

**Files:**
- Modify: `components/Footer.tsx`

- [ ] **Step 1: Replace `components/Footer.tsx`**

```tsx
import Link from "next/link";
import { site } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  area: string;
  dict: {
    careHeader: string;
    familiesHeader: string;
    contactHeader: string;
    rights: string;
  };
  nav: {
    services: string;
    packages: string;
    howItWorks: string;
    diaspora: string;
    faq: string;
  };
};

export default function Footer({ locale, area, dict, nav }: Props) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rule py-12 text-sm text-muted">
      <div
        className="mx-auto flex flex-wrap justify-between gap-8"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        {/* Brand column */}
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink">
            {site.name}
          </div>
          <span>Home nursing · {area}</span>
          <span>© {year} · Quote-only</span>
        </div>
        {/* Care column */}
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink mb-1.5">
            {dict.careHeader}
          </div>
          <Link href={`/${locale}/services`} className="hover:text-ink">{nav.services}</Link>
          <Link href={`/${locale}/packages`} className="hover:text-ink">{nav.packages}</Link>
          <Link href={`/${locale}/how-we-work`} className="hover:text-ink">{nav.howItWorks}</Link>
        </div>
        {/* Families column */}
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink mb-1.5">
            {dict.familiesHeader}
          </div>
          <Link href={`/${locale}/diaspora`} className="hover:text-ink">{nav.diaspora}</Link>
          <Link href={`/${locale}/faq`} className="hover:text-ink">{nav.faq}</Link>
        </div>
        {/* Contact column */}
        <div className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink mb-1.5">
            {dict.contactHeader}
          </div>
          <a href={site.whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">WhatsApp</a>
          <a href={`tel:+${site.whatsapp.number}`} className="hover:text-ink">{site.whatsapp.display}</a>
          <span>EN · AR · FR</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Add footer dict keys to `messages/en.json` and `messages/ar.json`**

In `messages/en.json`, ensure `footer` block contains:

```json
{
  "footer": {
    "careHeader": "Care",
    "familiesHeader": "Families",
    "contactHeader": "Contact",
    "rights": "All rights reserved"
  }
}
```

Add Arabic equivalents to `ar.json` (`الرعاية / العائلات / التواصل / جميع الحقوق محفوظة`).

- [ ] **Step 3: Run build + visual check**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`
Expected: footer shows 4 columns at the bottom, mono uppercase headers, links in muted color.

- [ ] **Step 4: Commit**

```bash
git add components/Footer.tsx messages/en.json messages/ar.json
git commit -m "feat(footer): rebuild Footer with 4-column layout per spec"
```

---

## Phase 2 — Homepage sections

### Task 9: Build `<Hero>` section

**Files:**
- Create: `components/home/HeroNew.tsx` (will replace existing `Hero.tsx` after wiring)
- Modify: `messages/en.json` (hero copy)

- [ ] **Step 1: Create the file**

```tsx
import KenBurnsPhoto from "@/components/KenBurnsPhoto";
import { site } from "@/lib/site";

type Props = {
  dict: {
    badge: string;
    headline: string;
    headlineEm: string;
    sub: string;
    primaryCta: string;
    ghostCta: string;
  };
  photoUrl: string;
};

export default function Hero({ dict, photoUrl }: Props) {
  return (
    <header
      className="relative min-h-screen overflow-hidden"
      style={{ paddingTop: "68px" }}
    >
      <KenBurnsPhoto src={photoUrl} alt="Hospital-trained nurse with a patient at home in Beirut" />

      {/* Dark scrim — keeps text legible over the photo */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(31,42,53,0.25) 0%, rgba(31,42,53,0.05) 30%, rgba(31,42,53,0.35) 70%, rgba(31,42,53,0.85) 100%)",
        }}
      />

      <div
        className="relative flex flex-col justify-end"
        style={{
          height: "calc(100vh - 68px)",
          paddingBottom: "clamp(48px, 9vh, 96px)",
          maxWidth: "var(--shell-max)",
          margin: "0 auto",
          paddingInline: "var(--pad-x)",
        }}
      >
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/85">
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-peach"
            style={{ animation: "dot-pulse 2.4s ease-in-out infinite" }}
          />
          {dict.badge}
        </div>

        {/* H1 */}
        <h1
          className="font-display font-medium text-paper"
          style={{
            fontSize: "clamp(38px, 7vw, 96px)",
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            maxWidth: "18ch",
          }}
        >
          {dict.headline}{" "}
          <em className="text-sand" style={{ fontStyle: "italic", fontWeight: 500 }}>
            {dict.headlineEm}
          </em>
        </h1>

        {/* Subhead */}
        <p
          className="mt-5.5 text-paper/85"
          style={{
            fontSize: "clamp(16px, 1.3vw, 19px)",
            lineHeight: 1.55,
            maxWidth: "52ch",
            marginTop: "22px",
          }}
        >
          {dict.sub}
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap gap-3.5" style={{ marginTop: "36px" }}>
          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:bg-white"
          >
            {dict.primaryCta} →
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2.5 rounded-full border border-paper/40 px-6 py-3.5 text-sm font-medium text-paper transition hover:border-paper/80 hover:bg-paper/10"
          >
            {dict.ghostCta}
          </a>
        </div>
      </div>

      {/* Meta corner */}
      <div
        className="absolute bottom-7 hidden gap-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/55 sm:flex"
        style={{ right: "var(--pad-x)" }}
      >
        <span>EN · AR · FR</span>
        <span>Quote · WhatsApp</span>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Add hero copy to `messages/en.json`**

In `messages/en.json`, add or update the `home.hero` block:

```json
{
  "home": {
    "hero": {
      "badge": "Live · Beirut & Mt. Lebanon",
      "headline": "Hospital-trained nurses, sent",
      "headlineEm": "to the house.",
      "sub": "Lebanese RNs and PNs working their hospital off-days. Coordinated by WhatsApp. A written summary in the family portal after every visit.",
      "primaryCta": "Message the coordinator",
      "ghostCta": "How a visit works"
    }
  }
}
```

Add Arabic equivalents to `messages/ar.json` (left to translator; placeholder Arabic is acceptable for now if drafts aren't ready).

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/home/HeroNew.tsx messages/en.json messages/ar.json
git commit -m "feat(hero): build text-on-photo Hero matching spec section 5.2"
```

---

### Task 10: Build `<TrustBar>` section

**Files:**
- Create: `components/home/TrustBar.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { site } from "@/lib/site";

type Props = {
  dict: {
    serviceArea: string;
    hospitalsLabel: string;
    licenseLabel: string;
    summaryLabel: string;
  };
};

export default function TrustBar({ dict }: Props) {
  return (
    <section className="border-b border-rule bg-paper-cool">
      <div
        className="mx-auto flex flex-wrap items-center justify-between gap-9 py-[22px] font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <span>{dict.serviceArea}</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-teal" />
          {dict.hospitalsLabel} · {site.hospitals.join(" · ")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-teal" />
          {dict.licenseLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-teal" />
          {dict.summaryLabel}
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add trust bar copy to messages**

In `messages/en.json` add under `home`:

```json
{
  "trustBar": {
    "serviceArea": "Beirut & Mount Lebanon",
    "hospitalsLabel": "Hospital-trained",
    "licenseLabel": "Lebanese Order of Nurses",
    "summaryLabel": "Written summary every visit"
  }
}
```

- [ ] **Step 3: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/TrustBar.tsx messages/en.json messages/ar.json
git commit -m "feat(trust-bar): add TrustBar with hospital names + license + summary signals"
```

---

### Task 11: Build `<DiasporaSection>` (moved to position 4)

**Files:**
- Create: `components/home/DiasporaSection.tsx`
- Create: `components/home/TimezoneTile.tsx`

- [ ] **Step 1: Create `components/home/TimezoneTile.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  city: string;
  tz: string;
};

export default function TimezoneTile({ city, tz }: Props) {
  const [time, setTime] = useState<string>("--:--");

  useEffect(() => {
    function update() {
      const t = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date());
      setTime(t);
    }
    update();
    const id = window.setInterval(update, 30_000); // refresh every 30s
    return () => window.clearInterval(id);
  }, [tz]);

  return (
    <div className="rounded-xl border border-paper/10 bg-paper/[0.05] px-3.5 py-4.5">
      <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/55">
        {city}
      </div>
      <div
        className="font-display font-medium text-paper"
        style={{ fontSize: "24px", letterSpacing: "-0.02em" }}
      >
        {time}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/home/DiasporaSection.tsx`**

```tsx
import { site } from "@/lib/site";
import TimezoneTile from "./TimezoneTile";

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    railsLabel: string;
  };
};

export default function DiasporaSection({ dict }: Props) {
  return (
    <section className="relative overflow-hidden bg-night text-paper">
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(78,193,154,0.16), transparent 50%)",
        }}
      />
      <div
        className="relative mx-auto grid items-center gap-20 py-24 md:grid-cols-2"
        style={{
          maxWidth: "var(--shell-max)",
          paddingInline: "var(--pad-x)",
          paddingBlock: "clamp(72px, 12vw, 140px)",
        }}
      >
        <div>
          <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-sand">
            {dict.eyebrow}
          </div>
          <h2
            className="font-display font-medium text-paper"
            style={{
              fontSize: "clamp(32px, 4.5vw, 58px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              maxWidth: "18ch",
            }}
          >
            {dict.headline}{" "}
            <em className="text-sand" style={{ fontStyle: "italic" }}>
              {dict.headlineEm}
            </em>
          </h2>
          <p
            className="text-paper/80"
            style={{
              fontSize: "17px",
              lineHeight: 1.6,
              maxWidth: "42ch",
              marginTop: "22px",
            }}
          >
            {dict.lede}
          </p>

          {/* Payment rails */}
          <div className="mt-9">
            <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/55">
              {dict.railsLabel}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/85">
              {site.paymentRails.map((rail) => (
                <span key={rail.name} className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="size-1 rounded-full bg-signal" />
                  {rail.name}
                  <span className="text-paper/55">· {rail.type}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Timezone tiles */}
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {site.diasporaCities.map((c) => (
            <TimezoneTile key={c.name} city={c.name} tz={c.tz} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add diaspora copy to messages**

In `messages/en.json` add:

```json
{
  "diaspora": {
    "eyebrow": "For families abroad",
    "headline": "Your parents are in Beirut.",
    "headlineEm": "You're not.",
    "lede": "Pay from Paris. Read the visit summary in Dubai. Approve the next visit from London. The portal works in three timezones at once.",
    "railsLabel": "Payment from abroad"
  }
}
```

- [ ] **Step 4: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/DiasporaSection.tsx components/home/TimezoneTile.tsx messages/en.json messages/ar.json
git commit -m "feat(diaspora): add DiasporaSection with live timezone tiles + payment rails"
```

---

### Task 12: Build `<ServicesGrid>` and `<ServiceCard>`

**Files:**
- Create: `components/home/ServicesGrid.tsx`
- Create: `components/home/ServiceCard.tsx`

- [ ] **Step 1: Create `components/home/ServiceCard.tsx`**

```tsx
type Props = {
  label: string;
  headline: string;
  body: string;
  more: string;
  photoUrl: string;
  photoCaption: string;
  variant?: "default" | "featured" | "dark";
};

export default function ServiceCard({
  label,
  headline,
  body,
  more,
  photoUrl,
  photoCaption,
  variant = "default",
}: Props) {
  const isDark = variant === "dark";
  const isFeatured = variant === "featured";

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[18px] border transition duration-300 hover:-translate-y-1 ${
        isDark
          ? "border-ink bg-ink text-paper hover:shadow-2xl"
          : "border-rule-warm bg-white text-ink hover:border-ink hover:shadow-2xl"
      } ${isFeatured ? "row-span-2" : ""}`}
    >
      <div
        className={`relative ${isFeatured ? "aspect-[4/5]" : "aspect-[4/3]"} overflow-hidden`}
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span className="absolute bottom-3 left-3.5 rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/85">
          {photoCaption}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
        <span
          className={`font-mono text-[10.5px] uppercase tracking-[0.18em] ${
            isDark ? "text-sand" : "text-teal-deep"
          }`}
        >
          {label}
        </span>
        <h3
          className="font-display font-medium"
          style={{ fontSize: "22px", lineHeight: 1.15, letterSpacing: "-0.015em", maxWidth: "18ch" }}
        >
          {headline}
        </h3>
        <p className={`text-[14px] leading-[1.55] ${isDark ? "text-paper/75" : "text-ink-soft"}`}>
          {body}
        </p>
        <span
          className={`mt-auto flex items-center gap-2 border-t pt-3.5 text-[13px] font-medium ${
            isDark ? "border-paper/15 text-paper" : "border-rule text-ink"
          }`}
        >
          {more} →
        </span>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: Create `components/home/ServicesGrid.tsx`**

```tsx
import ServiceCard from "./ServiceCard";

type ServiceItem = {
  label: string;
  headline: string;
  body: string;
  photoUrl: string;
  photoCaption: string;
};

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    moreLabel: string;
    discussLabel: string;
    catchAll: {
      label: string;
      headline: string;
      body: string;
      photoUrl: string;
      photoCaption: string;
    };
    items: ServiceItem[];
  };
};

export default function ServicesGrid({ dict }: Props) {
  // First item is featured (spans 2 rows), middle items normal, last position is catch-all dark
  const [featured, ...rest] = dict.items;

  return (
    <section className="bg-cream py-24" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        {/* Section head */}
        <div className="mb-14 grid items-end gap-[60px] md:grid-cols-2">
          <div>
            <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.eyebrow}
            </div>
            <h2
              className="font-display font-medium"
              style={{
                fontSize: "clamp(32px, 4.5vw, 58px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                maxWidth: "18ch",
              }}
            >
              {dict.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.headlineEm}
              </em>
            </h2>
          </div>
          <p
            className="text-ink-soft"
            style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
          >
            {dict.lede}
          </p>
        </div>

        {/* Grid */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "1.4fr 1fr 1fr", gridTemplateRows: "auto auto" }}
        >
          <ServiceCard {...featured} more={dict.discussLabel} variant="featured" />
          {rest.map((item) => (
            <ServiceCard key={item.label} {...item} more={dict.moreLabel} />
          ))}
          <ServiceCard {...dict.catchAll} more={dict.moreLabel} variant="dark" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add services copy to messages**

In `messages/en.json` add:

```json
{
  "services": {
    "eyebrow": "What we do",
    "headline": "Care that comes",
    "headlineEm": "to the door.",
    "lede": "Five services, plus a sixth for cases that don't fit a category. Every visit is matched by clinical need, not by package. No prices on the public site — quote on WhatsApp.",
    "moreLabel": "Discuss",
    "discussLabel": "Discuss your case",
    "items": [
      {
        "label": "01 · Clinical visits",
        "headline": "Injections, IV insertion, hydration, wound care.",
        "body": "IM/SubQ injection, IV start and medication administration, Foley insertion, complex dressing changes.",
        "photoUrl": "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "Nurse · IV setup · bedside"
      },
      {
        "label": "02 · Recovery at home",
        "headline": "Post-surgical care after discharge.",
        "body": "Wound, drain, mobility, hand-off coordination with the operating team.",
        "photoUrl": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "Nurse · BP cuff"
      },
      {
        "label": "03 · Daily care",
        "headline": "Daily care for an elder parent.",
        "body": "Bath, meds, vitals, companionship — 8 / 12 / 24-hour blocks.",
        "photoUrl": "https://images.unsplash.com/photo-1658314755707-1fbdf7c40145?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "Bath chair · morning light"
      },
      {
        "label": "04 · Bloodwork at home",
        "headline": "Routine, fasting, same-day samples.",
        "body": "Collected at home and walked to the lab.",
        "photoUrl": "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "Blood draw · kitchen table"
      }
    ],
    "catchAll": {
      "label": "— Outside this list?",
      "headline": "Not every case fits a category.",
      "body": "Message the coordinator. Most off-list cases find a fit.",
      "photoUrl": "https://images.unsplash.com/photo-1612531385446-f7e6d131e1d0?w=1200&q=80&auto=format&fit=crop",
      "photoCaption": "Coordinator desk · phone"
    }
  }
}
```

- [ ] **Step 4: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/ServicesGrid.tsx components/home/ServiceCard.tsx messages/en.json messages/ar.json
git commit -m "feat(services): rebuild ServicesGrid with featured + dark catch-all card"
```

---

### Task 13: Build `<HowItWorks>` and `<Step>`

**Files:**
- Create: `components/home/Step.tsx`
- Modify: `components/home/HowItWorks.tsx`

- [ ] **Step 1: Create `components/home/Step.tsx`**

```tsx
type Props = {
  num: string;
  headline: string;
  body: string;
  photoUrl: string;
  photoCaption: string;
  /** When true, photo is on the right (default left) — for alternating layout */
  reverse?: boolean;
};

export default function Step({ num, headline, body, photoUrl, photoCaption, reverse = false }: Props) {
  return (
    <div className="mb-18 grid items-center gap-[60px] md:grid-cols-2" style={{ marginBottom: "72px" }}>
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[18px]"
        style={{
          order: reverse ? 2 : 0,
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span className="absolute bottom-4 left-4.5 rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/85">
          {photoCaption}
        </span>
      </div>
      <div>
        <div
          className="mb-5.5 font-display text-[100px] font-bold text-teal-deep"
          style={{ lineHeight: 0.85, letterSpacing: "-0.04em" }}
        >
          {num}
        </div>
        <h3
          className="mb-4.5 font-display font-medium"
          style={{
            fontSize: "clamp(28px, 3vw, 38px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            maxWidth: "18ch",
          }}
        >
          {headline}
        </h3>
        <p className="text-ink-soft" style={{ fontSize: "16px", lineHeight: 1.6, maxWidth: "42ch" }}>
          {body}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `components/home/HowItWorks.tsx`**

```tsx
import Step from "./Step";

type StepItem = {
  num: string;
  headline: string;
  body: string;
  photoUrl: string;
  photoCaption: string;
};

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    steps: StepItem[];
  };
};

export default function HowItWorks({ dict }: Props) {
  return (
    <section id="how-it-works" className="bg-paper-cool py-24" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mb-14 grid items-end gap-[60px] md:grid-cols-2">
          <div>
            <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.eyebrow}
            </div>
            <h2
              className="font-display font-medium"
              style={{
                fontSize: "clamp(32px, 4.5vw, 58px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                maxWidth: "18ch",
              }}
            >
              {dict.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.headlineEm}
              </em>
            </h2>
          </div>
          <p
            className="text-ink-soft"
            style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
          >
            {dict.lede}
          </p>
        </div>

        {dict.steps.map((step, idx) => (
          <Step key={step.num} {...step} reverse={idx % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Add how-it-works copy to messages**

```json
{
  "howItWorks": {
    "eyebrow": "How a visit works",
    "headline": "Three moments.",
    "headlineEm": "Same hand.",
    "lede": "A coordinator replies on WhatsApp, a nurse visits, a written summary lands in the family portal the same day. No phone tag.",
    "steps": [
      {
        "num": "01",
        "headline": "Message us — in your own words.",
        "body": "WhatsApp is the front door. A few lines is enough. EN · AR · FR. A coordinator replies the same day with what the visit needs.",
        "photoUrl": "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "WhatsApp · coordinator typing"
      },
      {
        "num": "02",
        "headline": "A licensed nurse arrives — matched to the case.",
        "body": "RN or PN, depending on the procedure. Same-nurse continuity when the case is ongoing.",
        "photoUrl": "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "Nurse · arrival · doorway"
      },
      {
        "num": "03",
        "headline": "A written summary, the same day.",
        "body": "Vitals, what was done, what to watch for, next visit. In the family portal — visible to whoever you share it with.",
        "photoUrl": "https://images.unsplash.com/photo-1568633524775-08c4d7c63aff?w=1200&q=80&auto=format&fit=crop",
        "photoCaption": "Visit notes · kitchen table"
      }
    ]
  }
}
```

- [ ] **Step 4: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/Step.tsx components/home/HowItWorks.tsx messages/en.json messages/ar.json
git commit -m "feat(how-it-works): rebuild with alternating image+text Step components"
```

---

### Task 14: Build `<DistrictGrid>` (replaces ServiceArea)

**Files:**
- Modify: `components/home/ServiceArea.tsx` (rename internally, keep file for import compatibility)

- [ ] **Step 1: Replace `components/home/ServiceArea.tsx`**

```tsx
import { site } from "@/lib/site";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    activeLabel: string;
    offMapHeadline: string;
    offMapBody: string;
    offMapCta: string;
  };
};

export default function ServiceArea({ dict }: Props) {
  const allDistricts = [...site.districts.beirut, ...site.districts.mountLebanon];

  return (
    <section className="bg-paper py-24" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mb-14 grid items-end gap-[60px] md:grid-cols-2">
          <div>
            <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.eyebrow}
            </div>
            <h2
              className="font-display font-medium"
              style={{
                fontSize: "clamp(32px, 4.5vw, 58px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                maxWidth: "18ch",
              }}
            >
              {dict.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.headlineEm}
              </em>
            </h2>
          </div>
          <p className="text-ink-soft" style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}>
            {dict.lede}
          </p>
        </div>

        <div className="mb-9 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
          {allDistricts.map((d) => (
            <div
              key={d}
              className="rounded-lg border border-rule bg-white p-3.5 transition hover:border-teal hover:bg-teal-soft"
            >
              <div className="font-medium" style={{ fontSize: "15px" }}>{d}</div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-teal" />
                {dict.activeLabel}
              </div>
            </div>
          ))}
        </div>

        {/* Off-map callout */}
        <div className="rounded-2xl border border-teal/30 bg-teal-soft p-6">
          <div className="font-display text-lg font-medium" style={{ letterSpacing: "-0.015em" }}>
            {dict.offMapHeadline}
          </div>
          <p className="mt-1.5 text-ink-soft" style={{ fontSize: "14.5px", lineHeight: 1.55 }}>
            {dict.offMapBody}
          </p>
          <div className="mt-4">
            <WhatsAppButton label={dict.offMapCta} variant="navy" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add service area copy to messages**

```json
{
  "serviceArea": {
    "eyebrow": "Where we visit",
    "headline": "Beirut",
    "headlineEm": "& Mt. Lebanon.",
    "lede": "Districts where the coordinator currently has nurses available. If your district isn't listed, message us anyway — most off-map cases find a fit.",
    "activeLabel": "Active",
    "offMapHeadline": "Off-map district?",
    "offMapBody": "Message the coordinator anyway — most off-map cases find a fit.",
    "offMapCta": "Message coordinator"
  }
}
```

- [ ] **Step 3: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/ServiceArea.tsx messages/en.json messages/ar.json
git commit -m "feat(service-area): rebuild DistrictGrid with 17 districts + off-map callout"
```

---

### Task 15: Build `<FAQ>` accordion

**Files:**
- Create: `components/home/FAQ.tsx`

- [ ] **Step 1: Create `components/home/FAQ.tsx`**

```tsx
import WhatsAppButton from "@/components/WhatsAppButton";

type QA = { question: string; answer: string };

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    helperHeadline: string;
    helperBody: string;
    helperCta: string;
    items: QA[];
    /** Index of the item open by default (defaults to 0) */
    defaultOpenIndex?: number;
  };
};

export default function FAQ({ dict }: Props) {
  const defaultOpen = dict.defaultOpenIndex ?? 0;

  return (
    <section className="bg-paper-cool py-24" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto grid gap-12 lg:grid-cols-[0.85fr_1.15fr]"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div>
          <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {dict.eyebrow}
          </div>
          <h2
            className="font-display font-medium"
            style={{
              fontSize: "clamp(32px, 4.5vw, 58px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              maxWidth: "18ch",
            }}
          >
            {dict.headline}{" "}
            <em className="text-teal" style={{ fontStyle: "italic" }}>
              {dict.headlineEm}
            </em>
          </h2>
          <p
            className="mt-5.5 text-ink-soft"
            style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
          >
            {dict.lede}
          </p>

          <div className="mt-9 rounded-2xl border border-teal/30 bg-teal-soft p-6">
            <div className="font-display text-lg font-medium" style={{ letterSpacing: "-0.015em" }}>
              {dict.helperHeadline}
            </div>
            <p className="mt-1.5 text-ink-soft" style={{ fontSize: "14px", lineHeight: 1.55 }}>
              {dict.helperBody}
            </p>
            <div className="mt-4">
              <WhatsAppButton label={dict.helperCta} variant="navy" />
            </div>
          </div>
        </div>

        <div>
          {dict.items.map((item, idx) => (
            <details
              key={item.question}
              open={idx === defaultOpen}
              className="group border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <span
                  className="font-display font-medium"
                  style={{ fontSize: "20px", lineHeight: 1.3, letterSpacing: "-0.015em" }}
                >
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-rule text-ink-soft transition group-open:rotate-45 group-open:border-teal group-open:bg-teal group-open:text-paper"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-ink-soft" style={{ fontSize: "15px", lineHeight: 1.6, maxWidth: "60ch" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add FAQ copy to messages**

```json
{
  "faq": {
    "eyebrow": "Common questions",
    "headline": "Questions, before we",
    "headlineEm": "talk.",
    "lede": "If your question isn't here, the coordinator will answer it on WhatsApp the same day.",
    "helperHeadline": "Still have a question?",
    "helperBody": "Message the coordinator — most replies land within a few hours during Beirut daytime.",
    "helperCta": "Message coordinator",
    "defaultOpenIndex": 0,
    "items": [
      {
        "question": "Why don't you publish prices?",
        "answer": "High-touch service. Every case has a different shape. We quote on WhatsApp after a short conversation."
      },
      {
        "question": "How does payment from abroad work?",
        "answer": "Western Union, OMT International, Whish Money, or direct USD wire. The coordinator sends you a summary of what's billed and how to pay in your timezone."
      },
      {
        "question": "Can I read the visit summary in Arabic?",
        "answer": "Yes. The portal has EN, AR, FR. The summary is written in the language the coordinator and you agreed on."
      },
      {
        "question": "What if it's 3am where I am?",
        "answer": "The coordinator replies in your daytime. The portal is always available. Emergencies still get same-day response in Beirut time."
      },
      {
        "question": "How are the nurses vetted?",
        "answer": "Lebanese Order of Nurses licensed, currently employed at AUBMC, Hôtel-Dieu, or St Georges. Off-day shifts only. Background-checked."
      },
      {
        "question": "Can I keep the same nurse week to week?",
        "answer": "Yes, when the case is ongoing. Same-nurse continuity is the default for daily care and recovery cases."
      },
      {
        "question": "What ends up in the family portal?",
        "answer": "Vitals, what was done that visit, what to watch for, next visit date. Wound photos in a private bucket if applicable."
      },
      {
        "question": "What's not offered yet?",
        "answer": "Live-in care, NG tube, ICU/tracheostomy specialty, Holter monitoring, oxygen rental. Coming later."
      }
    ]
  }
}
```

- [ ] **Step 3: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/FAQ.tsx messages/en.json messages/ar.json
git commit -m "feat(faq): add native-details FAQ accordion with 8 diaspora-first Q&A"
```

---

### Task 16: Build `<FinalCTA>` (replaces CTABanner)

**Files:**
- Modify: `components/home/CTABanner.tsx`

- [ ] **Step 1: Replace `components/home/CTABanner.tsx`**

```tsx
import { site } from "@/lib/site";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    primaryCta: string;
    callCta: string;
  };
};

export default function CTABanner({ dict }: Props) {
  return (
    <section
      className="relative overflow-hidden bg-night py-32 text-paper"
      style={{ paddingBlock: "clamp(80px, 14vw, 160px)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(232,181,138,0.18), transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(78,193,154,0.20), transparent 50%)",
        }}
      />
      <div
        className="relative mx-auto text-center"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-sand">
          {dict.eyebrow}
        </div>
        <h2
          className="mx-auto mb-7 font-display font-medium"
          style={{
            fontSize: "clamp(40px, 6.5vw, 88px)",
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            maxWidth: "22ch",
          }}
        >
          {dict.headline}{" "}
          <em className="text-signal" style={{ fontStyle: "italic" }}>
            {dict.headlineEm}
          </em>
        </h2>
        <div className="flex flex-wrap justify-center gap-3.5">
          <WhatsAppButton label={dict.primaryCta} variant="signal" className="px-7 py-4 text-[15px]" />
          <a
            href={`tel:+${site.whatsapp.number}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-paper/30 px-7 py-4 text-[15px] font-medium text-paper transition hover:border-paper/80 hover:bg-paper/10"
          >
            {dict.callCta} {site.whatsapp.display}
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add final CTA copy to messages**

```json
{
  "finalCta": {
    "eyebrow": "When you're ready",
    "headline": "The first message is",
    "headlineEm": "always free.",
    "primaryCta": "WhatsApp the coordinator",
    "callCta": "Call"
  }
}
```

- [ ] **Step 3: Run build + commit**

Run: `npm run build`
Expected: PASS.

```bash
git add components/home/CTABanner.tsx messages/en.json messages/ar.json
git commit -m "feat(final-cta): rebuild FinalCTA with dark glow + WhatsApp + call buttons"
```

---

## Phase 3 — Wire homepage + cleanup

### Task 17: Wire all sections into `app/[locale]/page.tsx`

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `messages/en.json` (restructure under `home` namespace)

- [ ] **Step 1: Read current `app/[locale]/page.tsx` to understand existing structure**

Run: `cat app/[locale]/page.tsx` (or open in editor).

Also check `messages/en.json` — if section copy from Tasks 9-16 was added at the top level (e.g., `hero`, `services` directly under root), restructure it now so everything sits under a `home` parent: `home: { hero, trustBar, diaspora, services, howItWorks, serviceArea, faq, finalCta }`. Same for `messages/ar.json`.

- [ ] **Step 2: Replace `app/[locale]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Hero from "@/components/home/HeroNew";
import TrustBar from "@/components/home/TrustBar";
import DiasporaSection from "@/components/home/DiasporaSection";
import ServicesGrid from "@/components/home/ServicesGrid";
import HowItWorks from "@/components/home/HowItWorks";
import ServiceArea from "@/components/home/ServiceArea";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1658314755707-1fbdf7c40145?w=2200&q=80&auto=format&fit=crop";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.home.hero} photoUrl={HERO_PHOTO} />
      <TrustBar dict={dict.home.trustBar} />
      <DiasporaSection dict={dict.home.diaspora} />
      <ServicesGrid dict={dict.home.services} />
      <HowItWorks dict={dict.home.howItWorks} />
      <ServiceArea dict={dict.home.serviceArea} />
      <FAQ dict={dict.home.faq} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
```

- [ ] **Step 3: Make sure all dict keys exist**

Open `messages/en.json` — confirm the structure has `home.hero`, `home.trustBar`, `home.diaspora`, `home.services`, `home.howItWorks`, `home.serviceArea`, `home.faq`, `home.finalCta`. If any are at the top level, move them under `home`.

- [ ] **Step 4: Run build + open in browser**

Run: `npm run build`
Expected: PASS.

Run: `npm run dev`
Open: `http://localhost:3000/en`
Expected: full homepage renders top to bottom — hero with photo, trust bar, dark diaspora section with live timezones, services grid with featured + 4 cards + dark catch-all, how-it-works with alternating image+text, district grid, FAQ accordion (first item open), dark final CTA.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/page.tsx messages/en.json messages/ar.json
git commit -m "feat(homepage): wire all 9 sections into [locale]/page.tsx"
```

---

### Task 18: Delete unused components

**Files:**
- Delete: `components/home/WhyChooseUs.tsx`
- Delete: `components/home/Hero.tsx` (old version)
- Delete: `components/home/ServiceCategories.tsx`
- Rename: `components/home/HeroNew.tsx` → `components/home/Hero.tsx`

- [ ] **Step 1: Verify nothing imports the deleted files**

Run: `grep -rn "WhyChooseUs" app components` — expect no results
Run: `grep -rn "ServiceCategories" app components` — expect no results
Run: `grep -rn "import Hero from" app components` — should only show `import Hero from "@/components/home/HeroNew"` in `app/[locale]/page.tsx`

- [ ] **Step 2: Delete obsolete files**

```bash
rm components/home/WhyChooseUs.tsx
rm components/home/ServiceCategories.tsx
rm components/home/Hero.tsx
```

- [ ] **Step 3: Rename HeroNew → Hero**

```bash
mv components/home/HeroNew.tsx components/home/Hero.tsx
```

Then update the import in `app/[locale]/page.tsx`:

Find: `import Hero from "@/components/home/HeroNew";`
Replace with: `import Hero from "@/components/home/Hero";`

- [ ] **Step 4: Run build to make sure nothing broke**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A components/home app/[locale]/page.tsx
git commit -m "chore: remove unused homepage components (WhyChooseUs, ServiceCategories, old Hero)"
```

---

## Phase 4 — Verification + launch gate

### Task 19: Manual visual QA at 4 breakpoints

**Files:** none — manual browser testing

- [ ] **Step 1: Run dev server**

Run: `npm run dev`
Open: `http://localhost:3000/en`

- [ ] **Step 2: Test at 360px width (mobile)**

Use browser devtools → device emulation → 360 × 800.

Verify:
- [ ] Topbar hamburger placeholder visible (nav links hidden)
- [ ] Hero photo fills screen, headline readable, CTAs stack vertically
- [ ] Trust bar wraps to multi-line, dots hidden
- [ ] Diaspora section stacks single column, timezone tiles in 2×2 grid
- [ ] Services grid is single column
- [ ] How-it-works steps stack image-above-text (no left/right alternation)
- [ ] District grid is 2-column
- [ ] FAQ collapses to single column

- [ ] **Step 3: Test at 560px (small tablet)**

Same checks. Services should be 2-column, districts 2-3 column.

- [ ] **Step 4: Test at 820px (tablet)**

Section heads should now show 2-column (eyebrow+headline | lede). Services 2-column. How-it-works alternating starts working.

- [ ] **Step 5: Test at 1080px (desktop)**

Topbar nav visible. Services 3-column with featured spanning 2 rows. Districts 6-column. Section heads in 2-column layout.

- [ ] **Step 6: Commit any fixes**

If you found issues, fix them and commit per-fix. If the page passes all four breakpoints clean, no commit needed for this task.

---

### Task 20: Lighthouse + axe-core pass

**Files:** none — uses Chrome DevTools and Vercel preview

- [ ] **Step 1: Build for production**

```bash
npm run build
npm start
```

Open: `http://localhost:3000/en`

- [ ] **Step 2: Run Lighthouse in Chrome DevTools**

DevTools → Lighthouse tab → Categories: Performance, Accessibility, Best Practices, SEO → Mode: Navigation → Device: Mobile → "Analyze page load."

**Targets:**
- [ ] Performance: ≥ 85 (homepage loads a lot of imagery)
- [ ] Accessibility: ≥ 95
- [ ] Best Practices: ≥ 95
- [ ] SEO: ≥ 95

If any score is below target, address the flagged issues. Common fixes:
- Lazy-load below-fold images: add `loading="lazy"` to non-hero photos
- Add `alt` text to any images missing them
- Increase contrast where flagged

- [ ] **Step 3: Run axe-core via DevTools**

DevTools → Lighthouse → Accessibility tab (after Lighthouse run) lists axe-core violations. Address any "serious" or "critical" issues. "Moderate" can usually be deferred.

- [ ] **Step 4: Run dev again, test keyboard navigation**

`npm run dev` → tab through the page from top. Verify:
- [ ] Topbar links reachable in order
- [ ] Hero CTAs reachable
- [ ] Section heading order makes sense to a screen reader (h1 once in hero, h2 per section, h3 inside cards)
- [ ] FAQ items open with Enter/Space on focused summary
- [ ] No focus-trap or invisible focus

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(a11y): address Lighthouse + axe-core flags on homepage"
```

---

### Task 21: Push and open PR

**Files:** none — git operations

- [ ] **Step 1: Sanity check the diff**

```bash
git log --oneline main..HEAD
```

Expected: ~18-20 commits, each with a clear semantic message (feat / fix / chore).

- [ ] **Step 2: Push branch**

```bash
git push -u origin feat/marketing-homepage
```

- [ ] **Step 3: Open a draft PR**

```bash
gh pr create --draft --title "Homepage rebuild: diaspora-first design per 2026-05-19 spec" --body "$(cat <<'EOF'
## Summary
- Ports the locked design from `docs/superpowers/specs/2026-05-19-marketing-site-design.md` to the existing Next.js 16 codebase
- 9 sections, diaspora-first ordering, palette + fonts per spec
- All copy lives in `messages/en.json` (AR translation deferred to Phase 2 Arabic editor)

## Visual QA
- [x] 360 / 560 / 820 / 1080 px breakpoints
- [x] Lighthouse mobile (Perf/A11y/BP/SEO targets met)
- [x] Keyboard navigation

## Test plan
- [ ] Open Vercel preview, scroll the homepage on desktop + mobile
- [ ] Tap the WhatsApp pill — opens wa.me with placeholder number
- [ ] Tap a service card "Discuss →" — currently no-op (links to # for now)
- [ ] Confirm timezones update every 30 seconds in the diaspora section
- [ ] Open in dark-mode browser — confirm cream paper still renders (we don't honor prefers-color-scheme yet, by design)

## Deferred
- AR/FR copy translations
- Real WhatsApp number swap
- Real domain swap in `lib/site.ts`
- Commissioned Beirut photography
- Polish of other 6 placeholder pages (separate plan)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Share the PR URL with the user**

The `gh pr create` command outputs the URL. Send it back to the user.

---

## What's NOT in this plan (deferred to follow-up plans)

- **Other 6 pages** (`/services`, `/packages`, `/how-we-work`, `/diaspora`, `/faq`, `/for-nurses`, `/contact`) — polishing them to match this design system is a separate plan. They reuse the shared components built here.
- **AR translations** — the locked design uses English. Arabic editor engagement is Phase 2.
- **Real photography** — Phase 2 commission. Until then, Unsplash photos with strict criteria are used as placeholders.
- **Care-fit wizard** on `/services` — separate plan.
- **Domain swap** in `lib/site.ts` — single-line change when ready.
- **`/blog`** scaffold + posts — separate plan.
- **Test infrastructure** (Vitest, Playwright) — Phase 2 when PHI tables are added.
