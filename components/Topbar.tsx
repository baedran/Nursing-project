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
    whatsappLabel: string;
  };
};

export default function Topbar({ locale, dict }: Props) {
  return (
    <nav
      aria-label="Main navigation"
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

        {/* Desktop nav. Mobile menu (hamburger drawer) is deferred — see follow-up tasks. */}
        <div className="hidden gap-[26px] text-sm font-medium text-ink-soft lg:flex">
          <Link href={`/${locale}/services`} className="hover:text-ink">{dict.services}</Link>
          <Link href={`/${locale}/how-we-work`} className="hover:text-ink">{dict.howItWorks}</Link>
          <Link href={`/${locale}/diaspora`} className="hover:text-ink">{dict.diaspora}</Link>
          <Link href={`/${locale}/packages`} className="hover:text-ink">{dict.packages}</Link>
          <Link href={`/${locale}/faq`} className="hover:text-ink">{dict.faq}</Link>
        </div>

        {/* WhatsApp CTA */}
        <WhatsAppButton label={dict.whatsappLabel} />
      </div>
    </nav>
  );
}
