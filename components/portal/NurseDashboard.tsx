import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type Item = {
  visitId: string;
  summaryId: string | null;
  patientLabel: string;
  caseRef: string;
  scheduledLabel: string;
  status: string | null; // null = no summary yet
  sentBackReason: string | null;
};

export default function NurseDashboard({
  locale,
  dict,
  displayName,
  needs,
  sentBack,
  history,
}: {
  locale: string;
  dict: Dictionary;
  displayName: string;
  needs: Item[];
  sentBack: Item[];
  history: Item[];
}) {
  const t = dict.portal.nurseDash;
  const isEmpty = needs.length === 0 && sentBack.length === 0 && history.length === 0;

  function statusPill(status: string | null) {
    if (status === "published") return t.statusPublished;
    if (status === "in_review") return t.statusInReview;
    if (status === "submitted") return t.statusSubmitted;
    return t.statusWith;
  }

  return (
    <>
      {/* Eyebrow + headline */}
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
        {t.eyebrow}
      </div>
      <h1
        className="font-display font-medium"
        style={{
          fontSize: "clamp(28px, 4vw, 44px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
        }}
      >
        {t.headline.replace("{name}", displayName)}
      </h1>

      {/* Empty state */}
      {isEmpty && (
        <div className="mt-10">
          <p className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
            {t.empty}
          </p>
        </div>
      )}

      {/* Needs your write-up */}
      {needs.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
            {t.needsLabel}
          </div>
          <ul className="flex flex-col gap-3">
            {needs.map((item) => (
              <li
                key={item.visitId}
                className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-white px-5 py-4 border-l-2 border-peach"
              >
                <div>
                  <div
                    className="font-display font-medium"
                    style={{ fontSize: "19px", letterSpacing: "-0.015em" }}
                  >
                    {item.patientLabel}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    {item.caseRef} · {t.visitedPrefix} {item.scheduledLabel}
                  </div>
                </div>
                <Link
                  href={`/${locale}/portal/visits/${item.visitId}/summary`}
                  className="shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition hover:opacity-90"
                  style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
                >
                  {t.writeCta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sent back to fix */}
      {sentBack.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
            {t.sentBackLabel}
          </div>
          <ul className="flex flex-col gap-3">
            {sentBack.map((item) => (
              <li
                key={item.visitId}
                className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-white px-5 py-4 border-l-2 border-peach"
              >
                <div>
                  <div
                    className="font-display font-medium"
                    style={{ fontSize: "19px", letterSpacing: "-0.015em" }}
                  >
                    {item.patientLabel}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    {item.caseRef} · {t.visitedPrefix} {item.scheduledLabel}
                  </div>
                  {item.sentBackReason && (
                    <div className="mt-2 text-[13px] text-peach leading-[1.5]">
                      {item.sentBackReason}
                    </div>
                  )}
                </div>
                <Link
                  href={`/${locale}/portal/visits/${item.visitId}/summary`}
                  className="shrink-0 rounded-full px-4 py-2 text-[12px] font-medium transition hover:opacity-90"
                  style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
                >
                  {t.editCta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submitted & published history */}
      {history.length > 0 && (
        <div className="mt-10">
          <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
            {t.historyLabel}
          </div>
          <ul className="flex flex-col gap-3">
            {history.map((item) => (
              <li
                key={item.visitId}
                className="flex items-center justify-between gap-4 rounded-xl border border-rule bg-white px-5 py-4 opacity-70"
              >
                <div>
                  <div
                    className="font-display font-medium"
                    style={{ fontSize: "19px", letterSpacing: "-0.015em" }}
                  >
                    {item.patientLabel}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                    {item.caseRef} · {t.visitedPrefix} {item.scheduledLabel} · {statusPill(item.status)}
                  </div>
                </div>
                {item.status === "published" && item.summaryId && (
                  <Link
                    href={`/${locale}/portal/review/${item.summaryId}`}
                    className="shrink-0 rounded-full border border-rule px-4 py-2 text-[12px] font-medium text-ink-soft transition hover:opacity-90"
                  >
                    {t.viewCta}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
