type Props = {
  label: string;
  headline: string;
  body: string;
  more: string;
  photoUrl: string;
  photoCaption: string;
  variant?: "default" | "featured" | "dark";
};

export default function ServiceCard({
  label,
  headline,
  body,
  more,
  photoUrl,
  photoCaption,
  variant = "default",
}: Props) {
  const isDark = variant === "dark";
  const isFeatured = variant === "featured";

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[18px] border transition duration-300 hover:-translate-y-1 ${
        isDark
          ? "border-ink bg-ink text-paper hover:shadow-2xl"
          : "border-rule-warm bg-white text-ink hover:border-ink hover:shadow-2xl"
      } ${isFeatured ? "row-span-2" : ""}`}
    >
      <div
        className={`relative ${isFeatured ? "aspect-[4/5]" : "aspect-[4/3]"} overflow-hidden`}
        style={{
          backgroundImage: `url(${photoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span className="absolute bottom-3 left-3.5 rounded bg-ink/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-paper/85">
          {photoCaption}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
        <span
          className={`font-mono text-[10.5px] uppercase tracking-[0.18em] ${
            isDark ? "text-sand" : "text-teal-deep"
          }`}
        >
          {label}
        </span>
        <h3
          className="font-display font-medium"
          style={{ fontSize: "22px", lineHeight: 1.15, letterSpacing: "-0.015em", maxWidth: "18ch" }}
        >
          {headline}
        </h3>
        <p className={`text-[14px] leading-[1.55] ${isDark ? "text-paper/75" : "text-ink-soft"}`}>
          {body}
        </p>
        <span
          className={`mt-auto flex items-center gap-2 border-t pt-3.5 text-[13px] font-medium ${
            isDark ? "border-paper/15 text-paper" : "border-rule text-ink"
          }`}
        >
          {more} →
        </span>
      </div>
    </article>
  );
}
