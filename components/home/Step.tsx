type Props = {
  num: string;
  headline: string;
  body: string;
  photoUrl: string;
  photoCaption: string;
  /** When true, photo is on the right (default left) — for alternating layout */
  reverse?: boolean;
};

export default function Step({ num, headline, body, photoUrl, photoCaption, reverse = false }: Props) {
  return (
    <div className="grid items-center gap-[60px] md:grid-cols-2" style={{ marginBottom: "72px" }}>
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[18px]"
        style={{
          order: reverse ? 2 : 0,
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span className="absolute bottom-4 left-4.5 rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/85">
          {photoCaption}
        </span>
      </div>
      <div>
        <div
          className="mb-5.5 font-display text-[100px] font-bold text-teal-deep"
          style={{ lineHeight: 0.85, letterSpacing: "-0.04em" }}
        >
          {num}
        </div>
        <h3
          className="mb-4.5 font-display font-medium"
          style={{
            fontSize: "clamp(28px, 3vw, 38px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            maxWidth: "18ch",
          }}
        >
          {headline}
        </h3>
        <p className="text-ink-soft" style={{ fontSize: "16px", lineHeight: 1.6, maxWidth: "42ch" }}>
          {body}
        </p>
      </div>
    </div>
  );
}
