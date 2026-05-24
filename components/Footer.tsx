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
