import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Metadata } from "next";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?w=2200&q=80&auto=format&fit=crop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.forNurses.meta.title,
    description: dict.forNurses.meta.description,
  };
}

export default async function ForNursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.forNurses.hero} photoUrl={HERO_PHOTO} compact />
      <HowItWorks dict={dict.forNurses.steps} />

      {/* Why this works — 4-card grid */}
      <section className="bg-cream" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
        <div
          className="mx-auto"
          style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
        >
          <div className="mb-14 grid items-end gap-[60px] md:grid-cols-2">
            <div>
              <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                {dict.forNurses.benefits.eyebrow}
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
                {dict.forNurses.benefits.headline}{" "}
                <em className="text-teal" style={{ fontStyle: "italic" }}>
                  {dict.forNurses.benefits.headlineEm}
                </em>
              </h2>
            </div>
            <p
              className="text-ink-soft"
              style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
            >
              {dict.forNurses.benefits.lede}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {dict.forNurses.benefits.items.map((item) => (
              <article
                key={item.title}
                className="flex flex-col rounded-[18px] border border-rule-warm bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-ink hover:shadow-2xl"
              >
                <span className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-teal-deep">
                  {item.label}
                </span>
                <h3
                  className="mb-3 font-display font-medium"
                  style={{
                    fontSize: "20px",
                    lineHeight: 1.15,
                    letterSpacing: "-0.015em",
                    maxWidth: "18ch",
                  }}
                >
                  {item.title}
                </h3>
                <p className="text-[14px] leading-[1.55] text-ink-soft">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FAQ dict={dict.forNurses.faq} />
      <CTABanner dict={dict.forNurses.cta} />
    </>
  );
}
