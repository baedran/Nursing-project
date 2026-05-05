type HowItWorksDict = {
  eyebrow: string;
  heading: string;
  subtitle: string;
  step1Title: string;
  step1Description: string;
  step2Title: string;
  step2Description: string;
  step3Title: string;
  step3Description: string;
};

export default function HowItWorks({ dict }: { dict: HowItWorksDict }) {
  const steps = [
    { number: "01", title: dict.step1Title, description: dict.step1Description },
    { number: "02", title: dict.step2Title, description: dict.step2Description },
    { number: "03", title: dict.step3Title, description: dict.step3Description },
  ];

  return (
    <section className="py-20 sm:py-24 bg-slate-50 border-y border-slate-100">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div
            aria-hidden
            className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-blue-200 via-teal-200 to-blue-200"
          />

          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-white border border-slate-200 rounded-2xl p-7 hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white flex items-center justify-center text-base font-bold mb-5 shadow-md ring-4 ring-white">
                {step.number}
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-2">
                {step.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
