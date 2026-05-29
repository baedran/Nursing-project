import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import TrustBar from "@/components/home/TrustBar";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Metadata } from "next";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=2200&q=80&auto=format&fit=crop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.faq.meta.title,
    description: dict.faq.meta.description,
  };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.faq.hero} photoUrl={HERO_PHOTO} compact />
      <TrustBar dict={dict.home.trustBar} />
      <FAQ dict={dict.faq.list} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
