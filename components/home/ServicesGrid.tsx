import ServiceCard from "./ServiceCard";

type ServiceItem = {
  label: string;
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
    moreLabel: string;
    discussLabel: string;
    catchAll: {
      label: string;
      headline: string;
      body: string;
      photoUrl: string;
      photoCaption: string;
    };
    items: ServiceItem[];
  };
};

export default function ServicesGrid({ dict }: Props) {
  // First item is featured (spans 2 rows), remaining items normal, last position is catch-all dark
  const [featured, ...rest] = dict.items;

  return (
    <section className="bg-cream py-24" style={{ paddingBlock: "clamp(72px, 12vw, 140px)" }}>
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

        {/* Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:[grid-template-columns:1.4fr_1fr_1fr] lg:[grid-template-rows:auto_auto]">
          <ServiceCard {...featured} more={dict.discussLabel} variant="featured" />
          {rest.map((item) => (
            <ServiceCard key={item.label} {...item} more={dict.moreLabel} />
          ))}
          <ServiceCard {...dict.catchAll} more={dict.moreLabel} variant="dark" />
        </div>
      </div>
    </section>
  );
}
