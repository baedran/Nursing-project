import { site } from "@/lib/site";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = {
  dict: {
    eyebrow: string;
    headline: string;
    headlineEm: string;
    primaryCta: string;
    callCta: string;
  };
};

export default function CTABanner({ dict }: Props) {
  return (
    <section
      className="relative overflow-hidden bg-night text-paper"
      style={{ paddingBlock: "clamp(80px, 14vw, 160px)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 70%, rgba(232,181,138,0.18), transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(78,193,154,0.20), transparent 50%)",
        }}
      />
      <div
        className="relative mx-auto text-center"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mb-4.5 font-mono text-[11px] uppercase tracking-[0.18em] text-sand">
          {dict.eyebrow}
        </div>
        <h2
          className="mx-auto mb-7 font-display font-medium"
          style={{
            fontSize: "clamp(40px, 6.5vw, 88px)",
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            maxWidth: "22ch",
          }}
        >
          {dict.headline}{" "}
          <em className="text-signal" style={{ fontStyle: "italic" }}>
            {dict.headlineEm}
          </em>
        </h2>
        <div className="flex flex-wrap justify-center gap-3.5">
          <WhatsAppButton label={dict.primaryCta} variant="signal" className="px-7 py-4 text-[15px]" />
          <a
            href={`tel:+${site.whatsapp.number}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-paper/30 px-7 py-4 text-[15px] font-medium text-paper transition hover:border-paper/80 hover:bg-paper/10"
          >
            {dict.callCta} {site.whatsapp.display}
          </a>
        </div>
      </div>
    </section>
  );
}
