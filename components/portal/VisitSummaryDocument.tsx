type Vital = { label: string; value: string };

type ChecklistItem = string;

type Photo = {
  caption: string;
  /** Placeholder URL — in production this would be a signed URL from a private Supabase bucket */
  url: string;
};

export type VisitSummaryData = {
  // Header
  patientLabel: string;        // e.g. "Mariam · 78"
  district: string;            // e.g. "Achrafieh"
  visitDateLabel: string;      // e.g. "Tuesday · 14 May · 18:30"
  caseRef: string;             // e.g. "Case 2026-051"
  liveLabel: string;           // e.g. "Documented"
  printLabel: string;          // e.g. "Print summary"
  // Vitals
  vitalsHeading: string;
  vitals: Vital[];
  vitalsFootnote: string;
  // What was done
  doneHeading: string;
  doneBody: string;
  // Observations
  observationsHeading: string;
  observationsBody: string;
  // Medications
  medsHeading: string;
  meds: ChecklistItem[];
  // Watch for
  watchHeading: string;
  watchItems: ChecklistItem[];
  // Photos
  photosHeading: string;
  photosNote: string;
  photos: Photo[];
  // Next visit
  nextVisitHeading: string;
  nextVisitBody: string;
  // Coordinator note
  coordinatorNoteLabel: string;
  coordinatorNoteBody: string;
  // Footer
  footerLine: string;            // e.g. "Written by your case team · {date} Beirut time"
};

import PrintButton from "./PrintButton";

type Props = {
  data: VisitSummaryData;
};

export default function VisitSummaryDocument({ data }: Props) {
  return (
    <article
      className="overflow-hidden rounded-2xl border border-rule bg-white shadow-sm"
      style={{ boxShadow: "0 24px 64px -32px rgba(28, 29, 27, 0.18)" }}
    >
      {/* Header band */}
      <header className="border-b border-rule bg-paper-cool px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
              {data.caseRef}
            </div>
            <h2
              className="font-display font-medium"
              style={{ fontSize: "22px", letterSpacing: "-0.015em", lineHeight: 1.15 }}
            >
              {data.patientLabel}{" "}
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted" style={{ marginLeft: "8px", verticalAlign: "2px" }}>
                · {data.district}
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-right">
            <div>
              <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">
                {data.visitDateLabel}
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-teal-deep">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-teal" />
                {data.liveLabel}
              </span>
            </div>
            <PrintButton label={data.printLabel} />
          </div>
        </div>
      </header>

      {/* Vitals strip */}
      <section className="border-b border-rule px-6 py-6 sm:px-8">
        <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {data.vitalsHeading}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.vitals.map((v) => (
            <div key={v.label} className="rounded-lg border border-rule bg-paper-cool px-3 py-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {v.label}
              </div>
              <div
                className="font-display font-medium text-ink"
                style={{ fontSize: "22px", letterSpacing: "-0.02em", lineHeight: 1.05 }}
              >
                {v.value}
              </div>
            </div>
          ))}
        </div>
        {data.vitalsFootnote ? (
          <div className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            {data.vitalsFootnote}
          </div>
        ) : null}
      </section>

      {/* What was done */}
      <section className="border-b border-rule px-6 py-6 sm:px-8">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {data.doneHeading}
        </div>
        <p className="text-[15px] leading-[1.65] text-ink-soft">{data.doneBody}</p>
      </section>

      {/* Observations */}
      <section className="border-b border-rule px-6 py-6 sm:px-8">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {data.observationsHeading}
        </div>
        <p className="text-[15px] leading-[1.65] text-ink-soft">{data.observationsBody}</p>
      </section>

      {/* Medications */}
      {data.meds.length > 0 ? (
        <section className="border-b border-rule px-6 py-6 sm:px-8">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {data.medsHeading}
          </div>
          <ul className="flex flex-col gap-2">
            {data.meds.map((m) => (
              <li key={m} className="flex items-start gap-3 text-[15px] leading-[1.55] text-ink-soft">
                <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-teal" />
                {m}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Watch for */}
      <section className="border-b border-rule px-6 py-6 sm:px-8">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {data.watchHeading}
        </div>
        <ul className="flex flex-col gap-2">
          {data.watchItems.map((w) => (
            <li key={w} className="flex items-start gap-3 text-[15px] leading-[1.55] text-ink-soft">
              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-peach" />
              {w}
            </li>
          ))}
        </ul>
      </section>

      {/* Photos */}
      {data.photos.length > 0 ? (
        <section className="border-b border-rule px-6 py-6 sm:px-8">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {data.photosHeading}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {data.photosNote}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.photos.map((p) => (
              <figure key={p.caption} className="overflow-hidden rounded-lg border border-rule">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {/* Designed placeholder — real wound photos live in private buckets and only render for authorised family accounts */}
                  <div
                    aria-label={`${p.caption} — private content placeholder`}
                    role="img"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-paper-cool to-cream"
                  >
                    {/* Lock icon */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M6 10V8a6 6 0 0 1 12 0v2M5 10h14v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V10Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-teal-deep"
                      />
                    </svg>
                    <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-teal-deep">
                      Private content
                    </div>
                    <div className="px-3 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
                      Visible only to authorised family accounts
                    </div>
                  </div>
                </div>
                <figcaption className="border-t border-rule bg-paper-cool px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                  {p.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {/* Next visit */}
      <section className="border-b border-rule px-6 py-6 sm:px-8">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
          {data.nextVisitHeading}
        </div>
        <p className="text-[15px] leading-[1.65] text-ink-soft">{data.nextVisitBody}</p>
      </section>

      {/* Coordinator note */}
      <section className="bg-paper-cool px-6 py-5 sm:px-8">
        <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
          {data.coordinatorNoteLabel}
        </div>
        <p className="text-[14px] leading-[1.6] text-ink-soft">{data.coordinatorNoteBody}</p>
        <div className="mt-4 border-t border-rule pt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          {data.footerLine}
        </div>
      </section>
    </article>
  );
}
