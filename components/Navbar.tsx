"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { localeLabel, type Locale } from "@/lib/i18n";

type NavDict = {
  home: string;
  services: string;
  packages: string;
  howWeWork: string;
  forNurses: string;
  contact: string;
  requestNurse: string;
  toggleMenu: string;
};

export default function Navbar({
  locale,
  dict,
}: {
  locale: Locale;
  dict: NavDict;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: `/${locale}`, label: dict.home, exact: true },
    { href: `/${locale}/services`, label: dict.services },
    { href: `/${locale}/packages`, label: dict.packages },
    { href: `/${locale}/how-we-work`, label: dict.howWeWork },
    { href: `/${locale}/for-nurses`, label: dict.forNurses },
    { href: `/${locale}/contact`, label: dict.contact },
  ];

  // Build the equivalent path in the other locale by swapping the locale segment.
  function pathInLocale(targetLocale: Locale): string {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return `/${targetLocale}`;
    segments[0] = targetLocale;
    return "/" + segments.join("/");
  }

  const otherLocale = (site.locales as readonly Locale[]).find((l) => l !== locale)!;

  return (
    <header className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link href={`/${locale}`} className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
              />
            </svg>
          </span>
          <span className="text-slate-800 font-semibold text-base sm:text-lg tracking-tight">
            {site.shortName}
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-slate-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href={pathInLocale(otherLocale)}
            className="text-slate-500 hover:text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
            aria-label={`Switch to ${localeLabel[otherLocale]}`}
          >
            {localeLabel[otherLocale]}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
          >
            {dict.requestNurse}
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-slate-600"
          onClick={() => setOpen(!open)}
          aria-label={dict.toggleMenu}
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-3 text-slate-600 hover:text-blue-700 text-sm font-medium border-b border-slate-100 last:border-0"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={pathInLocale(otherLocale)}
            className="block py-3 text-slate-600 hover:text-blue-700 text-sm font-medium border-b border-slate-100"
            onClick={() => setOpen(false)}
          >
            {localeLabel[otherLocale]}
          </Link>
          <Link
            href={`/${locale}/contact`}
            className="mt-3 block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            onClick={() => setOpen(false)}
          >
            {dict.requestNurse}
          </Link>
        </div>
      )}
    </header>
  );
}
