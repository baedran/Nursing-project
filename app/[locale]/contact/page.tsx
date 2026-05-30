import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import WhatsAppButton from "@/components/WhatsAppButton";
import ContactForm from "@/components/contact/ContactForm";
import { site } from "@/lib/site";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Metadata } from "next";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=2200&q=80&auto=format&fit=crop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.contact.meta.title,
    description: dict.contact.meta.description,
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.contact.hero} photoUrl={HERO_PHOTO} compact />

      {/* WhatsApp-first section */}
      <section className="bg-paper" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
        <div
          className="mx-auto"
          style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
        >
          <div className="mx-auto max-w-[860px] text-center">
            <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.contact.whatsapp.eyebrow}
            </div>
            <h2
              className="mx-auto font-display font-medium"
              style={{
                fontSize: "clamp(32px, 4.5vw, 58px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                maxWidth: "20ch",
              }}
            >
              {dict.contact.whatsapp.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.contact.whatsapp.headlineEm}
              </em>
            </h2>
            <p
              className="mx-auto mt-5.5 text-ink-soft"
              style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "55ch" }}
            >
              {dict.contact.whatsapp.lede}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <WhatsAppButton
                label={dict.contact.whatsapp.cta}
                variant="signal"
                className="px-7 py-4 text-[15px]"
              />
              <a
                href={`tel:+${site.whatsapp.number}`}
                className="inline-flex items-center gap-2.5 rounded-full border border-rule px-7 py-4 text-[15px] font-medium text-ink transition hover:border-ink"
              >
                {dict.contact.whatsapp.callCta} {site.whatsapp.display}
              </a>
            </div>

            {/* Quick facts strip */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                  {dict.contact.facts.hoursLabel}
                </div>
                <div className="font-display text-[18px] font-medium tracking-[-0.015em]">
                  {dict.contact.facts.hoursValue}
                </div>
              </div>
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                  {dict.contact.facts.languagesLabel}
                </div>
                <div className="font-display text-[18px] font-medium tracking-[-0.015em]">
                  EN · AR · FR
                </div>
              </div>
              <div>
                <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                  {dict.contact.facts.areaLabel}
                </div>
                <div className="font-display text-[18px] font-medium tracking-[-0.015em]">
                  Beirut · Mt. Lebanon
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fallback form */}
      <section className="bg-paper-cool" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
        <div
          className="mx-auto"
          style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
        >
          <div className="mx-auto max-w-[640px]">
            <div className="mb-4.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.contact.form.eyebrow}
            </div>
            <h2
              className="mx-auto text-center font-display font-medium"
              style={{
                fontSize: "clamp(28px, 3.5vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-0.022em",
                maxWidth: "22ch",
              }}
            >
              {dict.contact.form.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.contact.form.headlineEm}
              </em>
            </h2>
            <p
              className="mx-auto mt-4 text-center text-ink-soft"
              style={{ fontSize: "15px", lineHeight: 1.55, maxWidth: "50ch" }}
            >
              {dict.contact.form.lede}
            </p>

            <div className="mt-8 rounded-2xl border border-rule bg-white p-6 sm:p-8">
              <ContactForm dict={dict.contact.formFields} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
