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
    title: dict.howWeWork.heading,
    description: dict.howWeWork.subtitle,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="mb-14 max-w-2xl">
        <span className="text-blue-600 text-xs font-semibold tracking-widest uppercase mb-3 block">
          {dict.howWeWork.eyebrow}
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          {dict.howWeWork.heading}
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          {dict.howWeWork.subtitle}
        </p>
      </div>

      <div className="space-y-6">
        {dict.howWeWork.steps.map((step) => (
          <div
            key={step.n}
            className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-5">
              <span className="shrink-0 text-3xl sm:text-4xl font-bold bg-gradient-to-br from-blue-600 to-teal-600 bg-clip-text text-transparent leading-none">
                {step.n}
              </span>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                  {step.title}
                </h2>
                <ul className="space-y-2.5">
                  {step.body.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2.5 text-sm sm:text-base text-slate-700 leading-relaxed"
                    >
                      <svg
                        className="w-4 h-4 mt-1 text-blue-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 bg-gradient-to-br from-blue-700 to-teal-600 rounded-2xl p-8 sm:p-10 text-center text-white shadow-lg">
        <h3 className="text-2xl font-bold mb-3">{dict.howWeWork.ctaHeading}</h3>
        <p className="text-blue-50 text-sm sm:text-base mb-7 max-w-md mx-auto">
          {dict.howWeWork.ctaSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            {dict.common.whatsappUs}
          </a>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            {dict.common.sendMessage}
          </Link>
        </div>
      </div>
    </div>
  );
}
