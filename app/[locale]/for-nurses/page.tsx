import type { Metadata } from "next";
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
    title: dict.forNurses.heading,
    description: dict.forNurses.subtitle.replace(
      "{area}",
      dict.common.serviceArea,
    ),
  };
}

export default async function ForNursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const area = dict.common.serviceArea;
  const fill = (s: string) => s.replace("{area}", area);

  const tracks = [
    { ...dict.forNurses.rnTrack, accent: "from-blue-500 to-teal-500" },
    { ...dict.forNurses.juniorTrack, accent: "from-amber-500 to-amber-600" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="mb-14 max-w-2xl">
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
          {dict.forNurses.pill}
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          {dict.forNurses.heading}
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          {fill(dict.forNurses.subtitle)}
        </p>
      </div>

      <div className="mb-14">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          {dict.forNurses.benefitsHeading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {dict.forNurses.benefits.map((b) => (
            <div
              key={b.title}
              className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-slate-900 text-sm mb-2">{b.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-14">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          {dict.forNurses.tracksHeading}
        </h2>
        <p className="text-slate-600 text-sm mb-6 max-w-2xl">
          {dict.forNurses.tracksSubtitle}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tracks.map((track) => (
            <div
              key={track.title}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col hover:shadow-md transition-shadow"
            >
              <span
                className={`inline-block self-start text-xs font-semibold px-3 py-1 rounded-full text-white bg-gradient-to-r ${track.accent} mb-4`}
              >
                {track.badge}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{track.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-5">
                {track.description}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {track.requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg
                      className="w-4 h-4 mt-0.5 text-blue-500 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
              <a
                href={site.whatsappUrlWith(track.applyMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {dict.common.applyForTrack}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-700 to-teal-600 rounded-2xl p-8 sm:p-10 text-center text-white shadow-lg">
        <h3 className="text-2xl font-bold mb-3">{dict.forNurses.ctaHeading}</h3>
        <p className="text-blue-50 text-sm sm:text-base mb-7 max-w-md mx-auto">
          {dict.forNurses.ctaSubtitle}
        </p>
        <a
          href={site.whatsappUrlWith(dict.forNurses.ctaMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
          {dict.common.applyOnWhatsapp}
        </a>
      </div>
    </div>
  );
}
