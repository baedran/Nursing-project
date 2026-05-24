import WhatsAppButton from "@/components/WhatsAppButton";

type QA = { question: string; answer: string };

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    helperHeadline: string;
    helperBody: string;
    helperCta: string;
    items: QA[];
    /** Index of the item open by default (defaults to 0) */
    defaultOpenIndex?: number;
  };
};

export default function FAQ({ dict }: Props) {
  const defaultOpen = dict.defaultOpenIndex ?? 0;

  return (
    <section className="bg-paper-cool" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto grid gap-12 lg:grid-cols-[0.85fr_1.15fr]"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
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
          <p
            className="mt-5.5 text-ink-soft"
            style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}
          >
            {dict.lede}
          </p>

          <div className="mt-9 rounded-2xl border border-teal/30 bg-teal-soft p-6">
            <div className="font-display text-lg font-medium" style={{ letterSpacing: "-0.015em" }}>
              {dict.helperHeadline}
            </div>
            <p className="mt-1.5 text-ink-soft" style={{ fontSize: "14px", lineHeight: 1.55 }}>
              {dict.helperBody}
            </p>
            <div className="mt-4">
              <WhatsAppButton label={dict.helperCta} variant="navy" />
            </div>
          </div>
        </div>

        <div>
          {dict.items.map((item, idx) => (
            <details
              key={item.question}
              open={idx === defaultOpen}
              className="group border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <span
                  className="font-display font-medium"
                  style={{ fontSize: "20px", lineHeight: 1.3, letterSpacing: "-0.015em" }}
                >
                  {item.question}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-rule text-ink-soft transition group-open:rotate-45 group-open:border-teal group-open:bg-teal group-open:text-paper"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-ink-soft" style={{ fontSize: "15px", lineHeight: 1.6, maxWidth: "60ch" }}>
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
