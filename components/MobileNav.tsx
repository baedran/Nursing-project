"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import WhatsAppButton from "./WhatsAppButton";
import type { Locale } from "@/lib/i18n";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  isAuthenticated?: boolean;
  dict: {
    services: string;
    howItWorks: string;
    packages: string;
    diaspora: string;
    faq: string;
    whatsappLabel: string;
    menuCloseLabel: string;
    loginLabel: string;
    portalLabel: string;
  };
};

export default function MobileNav({ isOpen, onClose, locale, dict, isAuthenticated = false }: Props) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Focus the close button on open, listen for Escape
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const navLinks = [
    { href: `/${locale}/services`, label: dict.services },
    { href: `/${locale}/how-we-work`, label: dict.howItWorks },
    { href: `/${locale}/diaspora`, label: dict.diaspora },
    { href: `/${locale}/packages`, label: dict.packages },
    { href: `/${locale}/faq`, label: dict.faq },
    {
      href: isAuthenticated ? `/${locale}/portal` : `/${locale}/login`,
      label: isAuthenticated ? dict.portalLabel : dict.loginLabel,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Main menu"
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[60] bg-paper transition-opacity duration-[240ms] motion-reduce:transition-none"
      style={{
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Top row — mirrors the Topbar shape */}
      <div
        className="mx-auto flex h-[68px] items-center justify-between border-b border-ink/[0.07]"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <Link href={`/${locale}`} onClick={onClose} className="flex items-center gap-3">
          <div className="relative size-[30px] rounded-[9px] bg-gradient-to-br from-ink to-ink-soft">
            <span className="absolute inset-[7px] rounded-[4px] border-[1.5px] border-paper/80" />
          </div>
          <div>
            <div className="font-display text-[16px] font-bold tracking-[-0.01em] text-ink">
              Caregivers Collective
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              Home nursing · est. 2026
            </div>
          </div>
        </Link>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label={dict.menuCloseLabel}
          className="flex size-10 items-center justify-center rounded-full border border-rule text-ink transition hover:bg-ink hover:text-paper"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Big centered nav */}
      <nav
        className="mx-auto flex flex-col items-stretch justify-center"
        style={{
          minHeight: "calc(100vh - 68px - 120px)",
          maxWidth: "var(--shell-max)",
          paddingInline: "var(--pad-x)",
          paddingBlock: "clamp(28px, 6vh, 64px)",
        }}
      >
        <ul className="flex flex-col">
          {navLinks.map((link, idx) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                className="block border-b border-rule py-5 font-display font-medium text-ink transition hover:text-teal"
                style={{
                  fontSize: "clamp(28px, 6vw, 38px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.025em",
                }}
              >
                <span
                  className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep"
                  style={{ marginRight: "14px", verticalAlign: "middle" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom WhatsApp CTA */}
      <div
        className="mx-auto"
        style={{
          maxWidth: "var(--shell-max)",
          paddingInline: "var(--pad-x)",
          paddingBlock: "24px",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
            EN · AR · FR · Beirut
          </div>
          <WhatsAppButton label={dict.whatsappLabel} variant="navy" />
        </div>
      </div>
    </div>
  );
}
