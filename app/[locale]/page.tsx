import { notFound } from "next/navigation";
import Hero from "@/components/home/Hero";
import ServiceCategories from "@/components/home/ServiceCategories";
import HowItWorks from "@/components/home/HowItWorks";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import ServiceArea from "@/components/home/ServiceArea";
import CTABanner from "@/components/home/CTABanner";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const area = dict.common.serviceArea;

  return (
    <>
      <Hero locale={locale} area={area} dict={dict.home.hero} />
      <ServiceCategories locale={locale} dict={dict.home.categories} />
      <HowItWorks dict={dict.home.howItWorks} />
      <WhyChooseUs dict={dict.home.whyChooseUs} />
      <ServiceArea dict={dict.home.serviceArea} />
      <CTABanner dict={dict.home.finalCta} />
    </>
  );
}
