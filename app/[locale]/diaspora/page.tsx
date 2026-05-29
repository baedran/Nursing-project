import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import DiasporaSection from "@/components/home/DiasporaSection";
import HowItWorks from "@/components/home/HowItWorks";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Metadata } from "next";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=2200&q=80&auto=format&fit=crop";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.diaspora.meta.title,
    description: dict.diaspora.meta.description,
  };
}

export default async function DiasporaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.diaspora.hero} photoUrl={HERO_PHOTO} compact />
      <DiasporaSection dict={dict.home.diaspora} />
      <HowItWorks dict={dict.home.howItWorks} />
      <FAQ dict={dict.diaspora.faq} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
