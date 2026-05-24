import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";
import { dirOf, getDictionary, htmlLang, isLocale, type Locale } from "@/lib/i18n";


export function generateStaticParams() {
  return site.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);
  const localizedUrl = `${site.url}/${locale}`;

  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — ${dict.meta.siteTagline}`,
      template: `%s — ${site.name}`,
    },
    description: dict.meta.siteDescription,
    applicationName: site.name,
    alternates: {
      canonical: localizedUrl,
      languages: {
        en: `${site.url}/en`,
        ar: `${site.url}/ar`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_LB" : "en_US",
      url: localizedUrl,
      siteName: site.name,
      title: `${site.name} — ${dict.meta.siteTagline}`,
      description: dict.meta.siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} — ${dict.meta.siteTagline}`,
      description: dict.meta.siteDescription,
    },
    robots: { index: true, follow: true },
  };
}

function buildStructuredData(locale: Locale, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: site.name,
    description,
    url: `${site.url}/${locale}`,
    telephone: `+${site.whatsapp.number}`,
    inLanguage: htmlLang[locale],
    areaServed: {
      "@type": "AdministrativeArea",
      name: site.serviceArea,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Beirut",
      addressRegion: "Beirut Governorate",
      addressCountry: "LB",
    },
    medicalSpecialty: [
      "HomeNursing",
      "WoundCare",
      "ElderlyCare",
      "PostOperativeCare",
    ],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const structuredData = buildStructuredData(locale, dict.meta.siteDescription);

  return (
    <html lang={htmlLang[locale]} dir={dirOf(locale)}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600,700&f[]=cabinet-grotesk@500,700,800&f[]=fragment-mono@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen flex flex-col bg-paper text-ink antialiased"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Navbar locale={locale} dict={dict.nav} />
        <main className="flex-1">{children}</main>
        <Footer
          locale={locale}
          area={dict.common.serviceArea}
          dict={dict.footer}
          nav={dict.nav}
        />
      </body>
    </html>
  );
}
