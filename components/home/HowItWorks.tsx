import Step from "./Step";

type StepItem = {
  num: string;
  headline: string;
  body: string;
  photoUrl: string;
  photoCaption: string;
};

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    steps: StepItem[];
  };
};

export default function HowItWorks({ dict }: Props) {
  return (
    <section id="how-it-works" className="bg-paper-cool" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mb-14 grid items-end gap-[60px] md:grid-cols-2">
          <div>
            <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {dict.eyebrow}
            </div>
            <h2
              className="font-display font-medium"
              style={{
                fontSize: "clamp(32px, 4.5vw, 58px)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                maxWidth: "18ch",
              }}
            >
              {dict.headline}{" "}
              <em className="text-teal" style={{ fontStyle: "italic" }}>
                {dict.headlineEm}
              </em>
            </h2>
          </div>
          <p
            className="text-ink-soft"
            style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
          >
            {dict.lede}
          </p>
        </div>

        {dict.steps.map((step, idx) => (
          <Step key={step.num} {...step} reverse={idx % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
