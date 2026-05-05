type WhyChooseUsDict = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  pillar1Title: string;
  pillar1Description: string;
  pillar2Title: string;
  pillar2Description: string;
  pillar3Title: string;
  pillar3Description: string;
  pillar4Title: string;
  pillar4Description: string;
};

export default function WhyChooseUs({ dict }: { dict: WhyChooseUsDict }) {
  const pillars = [
    {
      title: dict.pillar1Title,
      description: dict.pillar1Description,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: dict.pillar2Title,
      description: dict.pillar2Description,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: dict.pillar3Title,
      description: dict.pillar3Description,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: dict.pillar4Title,
      description: dict.pillar4Description,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-white">
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
          {pillars.map((p) => (
            <div
              key={p.title}
              className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-4">
                {p.icon}
              </div>
              <h3 className="font-semibold text-slate-900 text-base mb-2">
                {p.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
