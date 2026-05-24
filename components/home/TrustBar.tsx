import { site } from "@/lib/site";

type Props = {
  dict: {
    serviceArea: string;
    hospitalsLabel: string;
    licenseLabel: string;
    summaryLabel: string;
  };
};

export default function TrustBar({ dict }: Props) {
  return (
    <section className="border-b border-rule bg-paper-cool">
      <div
        className="mx-auto flex flex-wrap items-center justify-between gap-9 py-[22px] font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <span>{dict.serviceArea}</span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-teal" />
          {dict.hospitalsLabel} · {site.hospitals.join(" · ")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-teal" />
          {dict.licenseLabel}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1 rounded-full bg-teal" />
          {dict.summaryLabel}
        </span>
      </div>
    </section>
  );
}
