import { site } from "@/lib/site";

type ServiceAreaDict = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  beirut: string;
  mountLebanon: string;
};

export default function ServiceArea({
  area,
  dict,
}: {
  area: string;
  dict: ServiceAreaDict;
}) {
  const fill = (s: string) => s.replace("{area}", area);

  return (
    <section className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="text-blue-600 text-xs font-semibold tracking-widest uppercase mb-3 block">
            {dict.eyebrow}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            {fill(dict.heading)}
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">{dict.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              <h3 className="text-lg font-bold text-slate-900">{dict.beirut}</h3>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {site.districts.beirut.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-md">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21l3.5-7 4 4 3-6 4 3 3-5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 21h18"
                  />
                </svg>
              </span>
              <h3 className="text-lg font-bold text-slate-900">{dict.mountLebanon}</h3>
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {site.districts.mountLebanon.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2 text-sm text-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
