import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import HowItWorks from "@/components/home/HowItWorks";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
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
    title: dict.howWeWork.meta.title,
    description: dict.howWeWork.meta.description,
  };
}

export default async function HowWeWorkPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.howWeWork.hero} photoUrl={HERO_PHOTO} compact />
      <TrustBar dict={dict.home.trustBar} />
      <HowItWorks dict={dict.home.howItWorks} />
      <FAQ dict={dict.howWeWork.faq} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
