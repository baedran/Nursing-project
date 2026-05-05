import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.packages.heading,
    description: dict.packages.subtitle,
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

  const packages = [
    { ...dict.packages.single, accent: "from-blue-500 to-blue-600", featured: false },
    { ...dict.packages.weekly, accent: "from-teal-500 to-teal-600", featured: false },
    { ...dict.packages.longTerm, accent: "from-rose-500 to-rose-600", featured: true },
    { ...dict.packages.companion, accent: "from-amber-500 to-amber-600", featured: false },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="mb-14 max-w-2xl">
        <span className="text-blue-600 text-xs font-semibold tracking-widest uppercase mb-3 block">
          {dict.packages.eyebrow}
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          {dict.packages.heading}
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          {dict.packages.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.badge}
            className={`relative bg-white border rounded-2xl p-6 sm:p-8 hover:shadow-md transition-shadow flex flex-col ${
              pkg.featured
                ? "border-rose-300 ring-1 ring-rose-200"
                : "border-slate-200"
            }`}
          >
            {pkg.featured && (
              <span className="absolute -top-3 end-6 bg-rose-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                {dict.packages.featuredBadge}
              </span>
            )}
            <span
              className={`inline-block self-start text-xs font-semibold px-3 py-1 rounded-full text-white bg-gradient-to-r ${pkg.accent} mb-4`}
            >
              {pkg.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              {pkg.title}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              {pkg.description}
            </p>

            <div className="mb-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3">
                {dict.common.bestFor}
              </p>
              <ul className="space-y-1.5">
                {pkg.bestFor.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6 flex-1">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3">
                {dict.common.whatsIncluded}
              </p>
              <ul className="space-y-2">
                {pkg.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg
                      className="w-4 h-4 mt-0.5 text-blue-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={site.whatsappUrlWith(pkg.ctaMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
            >
              {dict.common.discussPackage}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        ))}
      </div>

      <div className="mt-14 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {dict.packages.ctaHeading}
        </h3>
        <p className="text-slate-600 text-sm sm:text-base mb-5 max-w-xl mx-auto">
          {dict.packages.ctaSubtitle}
        </p>
        <Link
          href={`/${locale}/contact`}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          {dict.common.bookFreeConsult}
        </Link>
      </div>
    </div>
  );
}
