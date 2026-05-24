import { site } from "@/lib/site";
import TimezoneTile from "./TimezoneTile";

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    railsLabel: string;
  };
};

export default function DiasporaSection({ dict }: Props) {
  return (
    <section className="relative overflow-hidden bg-night text-paper">
      {/* Decorative glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(78,193,154,0.16), transparent 50%)",
        }}
      />
      <div
        className="relative mx-auto grid items-center gap-20 py-24 md:grid-cols-2"
        style={{
          maxWidth: "var(--shell-max)",
          paddingInline: "var(--pad-x)",
          paddingBlock: "clamp(72px, 12vw, 140px)",
        }}
      >
        <div>
          <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-sand">
            {dict.eyebrow}
          </div>
          <h2
            className="font-display font-medium text-paper"
            style={{
              fontSize: "clamp(32px, 4.5vw, 58px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              maxWidth: "18ch",
            }}
          >
            {dict.headline}{" "}
            <em className="text-sand" style={{ fontStyle: "italic" }}>
              {dict.headlineEm}
            </em>
          </h2>
          <p
            className="text-paper/80"
            style={{
              fontSize: "17px",
              lineHeight: 1.6,
              maxWidth: "42ch",
              marginTop: "22px",
            }}
          >
            {dict.lede}
          </p>

          {/* Payment rails */}
          <div className="mt-9">
            <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-paper/55">
              {dict.railsLabel}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/85">
              {site.paymentRails.map((rail) => (
                <span key={rail.name} className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="size-1 rounded-full bg-signal" />
                  {rail.name}
                  <span className="text-paper/55">· {rail.type}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Timezone tiles */}
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
          {site.diasporaCities.map((c) => (
            <TimezoneTile key={c.name} city={c.name} tz={c.tz} />
          ))}
        </div>
      </div>
    </section>
  );
}
