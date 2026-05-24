import { notFound } from "next/navigation";
import Hero from "@/components/home/HeroNew";
import TrustBar from "@/components/home/TrustBar";
import DiasporaSection from "@/components/home/DiasporaSection";
import ServicesGrid from "@/components/home/ServicesGrid";
import HowItWorks from "@/components/home/HowItWorks";
import ServiceArea from "@/components/home/ServiceArea";
import FAQ from "@/components/home/FAQ";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1658314755707-1fbdf7c40145?w=2200&q=80&auto=format&fit=crop";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <>
      <Hero dict={dict.home.hero} photoUrl={HERO_PHOTO} />
      <TrustBar dict={dict.home.trustBar} />
      <DiasporaSection dict={dict.home.diaspora} />
      <ServicesGrid dict={dict.home.services} />
      <HowItWorks dict={dict.home.howItWorks} />
      <ServiceArea dict={dict.home.serviceArea} />
      <FAQ dict={dict.home.faq} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
