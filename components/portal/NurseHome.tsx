import type { Dictionary } from "@/lib/i18n";

export default function NurseHome({
  dict,
  displayName,
}: {
  dict: Dictionary;
  displayName: string;
}) {
  const n = dict.portal.nurseHome;

  return (
    <>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
        {n.eyebrow}
      </div>
      <h1
        className="font-display font-medium"
        style={{
          fontSize: "clamp(28px, 4vw, 44px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
        }}
      >
        {n.headline.replace("{name}", displayName)}
      </h1>

      <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">{n.body}</p>

      <div className="mt-10">
        <p className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
          {n.noVisits}
        </p>
      </div>
    </>
  );
}
