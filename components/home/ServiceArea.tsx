import { site } from "@/lib/site";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    lede: string;
    activeLabel: string;
    offMapHeadline: string;
    offMapBody: string;
    offMapCta: string;
  };
};

export default function ServiceArea({ dict }: Props) {
  const allDistricts = [...site.districts.beirut, ...site.districts.mountLebanon];

  return (
    <section className="bg-paper" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
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
          <p className="text-ink-soft" style={{ fontSize: "clamp(15px, 1.2vw, 18px)", lineHeight: 1.55, maxWidth: "42ch" }}>
            {dict.lede}
          </p>
        </div>

        <div className="mb-9 grid grid-cols-2 gap-3.5 md:grid-cols-3 lg:grid-cols-6">
          {allDistricts.map((d) => (
            <div
              key={d}
              className="rounded-lg border border-rule bg-white p-3.5 transition hover:border-teal hover:bg-teal-soft"
            >
              <div className="font-medium" style={{ fontSize: "15px" }}>{d}</div>
              <div className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-teal" />
                {dict.activeLabel}
              </div>
            </div>
          ))}
        </div>

        {/* Off-map callout */}
        <div className="rounded-2xl border border-teal/30 bg-teal-soft p-6">
          <div className="font-display text-lg font-medium" style={{ letterSpacing: "-0.015em" }}>
            {dict.offMapHeadline}
          </div>
          <p className="mt-1.5 text-ink-soft" style={{ fontSize: "14.5px", lineHeight: 1.55 }}>
            {dict.offMapBody}
          </p>
          <div className="mt-4">
            <WhatsAppButton label={dict.offMapCta} variant="navy" />
          </div>
        </div>
      </div>
    </section>
  );
}
