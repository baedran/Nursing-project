import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type CategoryDict = {
  title: string;
  description: string;
  items: string[];
};

type CategoriesDict = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  viewAll: string;
  postOp: CategoryDict;
  elderly: CategoryDict;
  ivWound: CategoryDict;
  junior: CategoryDict;
};

export default function ServiceCategories({
  locale,
  dict,
}: {
  locale: Locale;
  dict: CategoriesDict;
}) {
  const categories = [
    {
      accent: "from-blue-500 to-blue-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      ...dict.postOp,
    },
    {
      accent: "from-teal-500 to-teal-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
        </svg>
      ),
      ...dict.elderly,
    },
    {
      accent: "from-indigo-500 to-indigo-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      ...dict.ivWound,
    },
    {
      accent: "from-amber-500 to-amber-600",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      ...dict.junior,
    },
  ];

  return (
    <section id="services" className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <span className="text-blue-600 text-xs font-semibold tracking-widest uppercase mb-3 block">
            {dict.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            {dict.heading}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">{dict.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="group relative bg-white border border-slate-200 rounded-2xl p-7 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.accent} text-white flex items-center justify-center shadow-md mb-5`}
              >
                {cat.icon}
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">
                {cat.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                {cat.description}
              </p>
              <ul className="space-y-2">
                {cat.items.map((item) => (
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
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href={`/${locale}/services`}
            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-800 text-sm font-semibold"
          >
            {dict.viewAll}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
