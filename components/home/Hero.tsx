import KenBurnsPhoto from "@/components/KenBurnsPhoto";
import { site } from "@/lib/site";

type Props = {
  dict: {
    badge: string;
    headline: string;
    headlineEm: string;
    sub: string;
    primaryCta: string;
    ghostCta: string;
  };
  photoUrl: string;
};

export default function Hero({ dict, photoUrl }: Props) {
  return (
    <header
      className="relative min-h-screen overflow-hidden"
      style={{ paddingTop: "68px" }}
    >
      <KenBurnsPhoto src={photoUrl} alt="Hospital-trained nurse with a patient at home in Beirut" />

      {/* Dark scrim — keeps text legible over the photo */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(19,32,44,0.25) 0%, rgba(19,32,44,0.05) 30%, rgba(19,32,44,0.35) 70%, rgba(19,32,44,0.85) 100%)",
        }}
      />

      <div
        className="relative flex flex-col justify-end"
        style={{
          height: "calc(100vh - 68px)",
          paddingBottom: "clamp(48px, 9vh, 96px)",
          maxWidth: "var(--shell-max)",
          margin: "0 auto",
          paddingInline: "var(--pad-x)",
        }}
      >
        {/* Badge */}
        <div
          className="mb-6 inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper/85"
          style={{ opacity: 0, animation: "rise 1s 0.3s forwards ease-out" }}
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-peach"
            style={{ animation: "dot-pulse 2.4s ease-in-out infinite" }}
          />
          {dict.badge}
        </div>

        {/* H1 */}
        <h1
          className="font-display font-medium text-paper"
          style={{
            fontSize: "clamp(38px, 7vw, 96px)",
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            maxWidth: "18ch",
            opacity: 0,
            animation: "rise 1.1s 0.5s forwards ease-out",
          }}
        >
          {dict.headline}{" "}
          <em className="text-sand" style={{ fontStyle: "italic", fontWeight: 500 }}>
            {dict.headlineEm}
          </em>
        </h1>

        {/* Subhead */}
        <p
          className="text-paper/85"
          style={{
            fontSize: "clamp(16px, 1.3vw, 19px)",
            lineHeight: 1.55,
            maxWidth: "52ch",
            marginTop: "22px",
            opacity: 0,
            animation: "rise 1.1s 0.75s forwards ease-out",
          }}
        >
          {dict.sub}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap gap-3.5"
          style={{ marginTop: "36px", opacity: 0, animation: "rise 1.1s 0.95s forwards ease-out" }}
        >
          <a
            href={site.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-paper px-6 py-3.5 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:bg-white"
          >
            {dict.primaryCta} →
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2.5 rounded-full border border-paper/40 px-6 py-3.5 text-sm font-medium text-paper transition hover:border-paper/80 hover:bg-paper/10"
          >
            {dict.ghostCta}
          </a>
        </div>
      </div>

      {/* Meta corner */}
      <div
        className="absolute bottom-7 hidden gap-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/55 sm:flex"
        style={{ right: "var(--pad-x)" }}
      >
        <span>EN · AR · FR</span>
        <span>Quote · WhatsApp</span>
      </div>
    </header>
  );
}
