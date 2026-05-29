import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import ServicesGrid from "@/components/home/ServicesGrid";
import HowItWorks from "@/components/home/HowItWorks";
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
    title: dict.services.meta.title,
    description: dict.services.meta.description,
  };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.services.hero} photoUrl={HERO_PHOTO} compact />
      <TrustBar dict={dict.home.trustBar} />
      <ServicesGrid dict={dict.home.services} />
      <HowItWorks dict={dict.home.howItWorks} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
