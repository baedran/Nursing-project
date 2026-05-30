import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import CTABanner from "@/components/home/CTABanner";
import VisitSummaryDocument from "@/components/portal/VisitSummaryDocument";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Metadata } from "next";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1568633524775-08c4d7c63aff?w=2200&q=80&auto=format&fit=crop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.whatWeSend.meta.title,
    description: dict.whatWeSend.meta.description,
  };
}

export default async function WhatWeSendPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.whatWeSend.hero} photoUrl={HERO_PHOTO} compact />
      <TrustBar dict={dict.home.trustBar} />

      {/* Document section */}
      <section className="bg-paper-cool" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
        <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
          <div className="mb-10 grid items-end gap-[60px] md:grid-cols-2">
            <div>
              <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
                {dict.whatWeSend.documentSection.eyebrow}
              </div>
              <h2
                className="font-display font-medium"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1.08,
                  letterSpacing: "-0.025em",
                  maxWidth: "20ch",
                }}
              >
                {dict.whatWeSend.documentSection.headline}{" "}
                <em className="text-teal" style={{ fontStyle: "italic" }}>
                  {dict.whatWeSend.documentSection.headlineEm}
                </em>
              </h2>
            </div>
            <p
              className="text-ink-soft"
              style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
            >
              {dict.whatWeSend.documentSection.lede}
            </p>
          </div>

          {/* The sample document */}
          <div className="mx-auto" style={{ maxWidth: "880px" }}>
            <VisitSummaryDocument data={dict.whatWeSend.sample} />
          </div>

          {/* Read-it-as instructions */}
          <div className="mx-auto mt-12 grid gap-6 sm:grid-cols-3" style={{ maxWidth: "880px" }}>
            {dict.whatWeSend.readGuide.map((item) => (
              <div key={item.label} className="border-l-2 border-teal pl-4">
                <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                  {item.label}
                </div>
                <h3
                  className="mb-2 font-display font-medium"
                  style={{ fontSize: "17px", lineHeight: 1.2, letterSpacing: "-0.015em" }}
                >
                  {item.title}
                </h3>
                <p className="text-[13.5px] leading-[1.55] text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
