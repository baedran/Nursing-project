import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type QueueItem = {
  id: string;
  patientLabel: string;
  caseRef: string;
  nurseName: string | null;
  visitWhen: string;
};

export default function CoordinatorHome({
  locale,
  dict,
  displayName,
  queue,
}: {
  locale: string;
  dict: Dictionary;
  displayName: string;
  queue: QueueItem[];
}) {
  const c = dict.portal.coordinator;

  return (
    <>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
        {c.eyebrow}
      </div>
      <h1
        className="font-display font-medium"
        style={{
          fontSize: "clamp(28px, 4vw, 44px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
        }}
      >
        {c.headline}
      </h1>
      {displayName ? (
        <p className="mt-2 text-[15px] text-ink-soft">{displayName}</p>
      ) : null}

      {/* Queue */}
      <div className="mt-10">
        <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {c.queueLabel}
        </div>
        {queue.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-white px-5 py-4"
              >
                <div>
                  <div
                    className="font-display font-medium"
                    style={{ fontSize: "19px", letterSpacing: "-0.015em" }}
                  >
                    {item.patientLabel}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    {item.caseRef} · {item.nurseName ?? "—"} · {item.visitWhen}
                  </div>
                </div>
                <Link
                  href={`/${locale}/portal/review/${item.id}`}
                  className="shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition hover:opacity-90"
                  style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
                >
                  {c.reviewCta}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
            {c.queueEmpty}
          </p>
        )}
      </div>

      {/* Management cards */}
      <div className="mt-10 flex flex-col gap-3">
        {/* Manage nurses */}
        <div className="rounded-2xl border border-teal/30 bg-teal-soft p-6">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
            {c.manageNursesLabel}
          </div>
          <h2
            className="mt-2 font-display font-medium"
            style={{ fontSize: "20px", letterSpacing: "-0.018em", lineHeight: 1.2 }}
          >
            {c.manageNursesLabel}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">
            {c.manageNursesBody}
          </p>
          <Link
            href={`/${locale}/portal/nurses`}
            className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            {c.openLabel} →
          </Link>
        </div>

        {/* Schedule a visit */}
        <div className="rounded-2xl border border-teal/30 bg-teal-soft p-6">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
            {c.scheduleLabel}
          </div>
          <h2
            className="mt-2 font-display font-medium"
            style={{ fontSize: "20px", letterSpacing: "-0.018em", lineHeight: 1.2 }}
          >
            {c.scheduleLabel}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">
            {c.scheduleBody}
          </p>
          <Link
            href={`/${locale}/portal/schedule`}
            className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90"
            style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
          >
            {c.openLabel} →
          </Link>
        </div>
      </div>
    </>
  );
}
