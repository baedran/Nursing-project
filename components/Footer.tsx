import Link from "next/link";
import { site } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

type FooterDict = {
  blurb: string;
  quickLinks: string;
  contactHeading: string;
  available: string;
  rights: string;
};

type NavDict = {
  services: string;
  packages: string;
  howWeWork: string;
  faq: string;
  forNurses: string;
  contact: string;
};

export default function Footer({
  locale,
  area,
  dict,
  nav,
}: {
  locale: Locale;
  area: string;
  dict: FooterDict;
  nav: NavDict;
}) {
  const blurb = dict.blurb.replace("{area}", area);

  const links = [
    { href: `/${locale}/services`, label: nav.services },
    { href: `/${locale}/packages`, label: nav.packages },
    { href: `/${locale}/how-we-work`, label: nav.howWeWork },
    { href: `/${locale}/faq`, label: nav.faq },
    { href: `/${locale}/for-nurses`, label: nav.forNurses },
    { href: `/${locale}/contact`, label: nav.contact },
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                />
              </svg>
            </span>
            <p className="text-white font-semibold text-base">{site.name}</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{blurb}</p>
        </div>

        <div>
          <p className="text-white font-medium text-sm mb-3">{dict.quickLinks}</p>
          <ul className="space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-white font-medium text-sm mb-3">{dict.contactHeading}</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <a
                href={site.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                WhatsApp: {site.whatsapp.display}
              </a>
            </li>
            <li>{area}</li>
            <li>{dict.available}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 text-center text-xs text-slate-500 py-4">
        © {new Date().getFullYear()} {site.name}. {dict.rights}
      </div>
    </footer>
  );
}
