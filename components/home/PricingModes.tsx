import WhatsAppButton from "@/components/WhatsAppButton";

type ModeItem = {
  number: string;
  label: string;
  headline: string;
  body: string;
  bullets: string[];
  ctaLabel: string;
  ctaMessage: string;
};

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    items: ModeItem[];
  };
};

export default function PricingModes({ dict }: Props) {
  return (
    <section className="bg-paper-cool" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        {/* Section head */}
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

        {/* 3 cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {dict.items.map((item, idx) => {
            const featured = idx === 1; // middle card
            return (
              <article
                key={item.number}
                className={`flex flex-col rounded-[18px] border p-7 transition duration-300 hover:-translate-y-1 ${
                  featured
                    ? "border-ink bg-ink text-paper hover:shadow-2xl"
                    : "border-rule-warm bg-white text-ink hover:border-ink hover:shadow-2xl"
                }`}
              >
                <span
                  className={`mb-3 font-mono text-[10.5px] uppercase tracking-[0.18em] ${
                    featured ? "text-sand" : "text-teal-deep"
                  }`}
                >
                  {item.number} · {item.label}
                </span>
                <h3
                  className="mb-3 font-display font-medium"
                  style={{
                    fontSize: "22px",
                    lineHeight: 1.15,
                    letterSpacing: "-0.015em",
                    maxWidth: "18ch",
                  }}
                >
                  {item.headline}
                </h3>
                <p
                  className={`mb-6 text-[14px] leading-[1.55] ${
                    featured ? "text-paper/75" : "text-ink-soft"
                  }`}
                >
                  {item.body}
                </p>
                <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                  {item.bullets.map((b) => (
                    <li
                      key={b}
                      className={`flex items-start gap-2 text-[14px] leading-[1.5] ${
                        featured ? "text-paper/85" : "text-ink-soft"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-2 size-1 shrink-0 rounded-full ${
                          featured ? "bg-sand" : "bg-teal"
                        }`}
                      />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <WhatsAppButton
                    label={item.ctaLabel}
                    message={item.ctaMessage}
                    variant={featured ? "paper-on-dark" : "navy"}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
