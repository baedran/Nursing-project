import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import PricingModes from "@/components/home/PricingModes";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Metadata } from "next";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=2200&q=80&auto=format&fit=crop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.packages.meta.title,
    description: dict.packages.meta.description,
  };
}

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.packages.hero} photoUrl={HERO_PHOTO} compact />
      <TrustBar dict={dict.home.trustBar} />
      <PricingModes dict={dict.packages.modes} />
      <FAQ dict={dict.packages.faq} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
