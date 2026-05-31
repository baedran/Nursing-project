import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { formatBeirut } from "@/lib/portal/datetime";

export default async function PatientPage({
  params,
}: {
  params: Promise<{ locale: string; patientId: string }>;
}) {
  const { locale, patientId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.portal.patient;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // portal layout already redirects unauthenticated users

  // RLS restricts patients to the caller's own family. A missing row means
  // either it doesn't exist or it isn't this family's — both render as 404.
  const { data: patient } = await supabase
    .from("patients")
    .select("id, display_label, district")
    .eq("id", patientId)
    .single();
  if (!patient) notFound();

  // Published summaries for this patient, newest first.
  //
  // We resolve this in two steps on purpose: first the patient's case ids, then
  // summaries filtered by their visit's case_id. A single query with a
  // two-level embedded filter (visits.cases.patient_id) silently returns no
  // rows in PostgREST even when the data is readable — one-level embedded
  // filters like visits.case_id are reliable. Family RLS still limits
  // visit_summaries to own-family + published, so this only scopes to patient.
  const { data: caseRows } = await supabase
    .from("cases")
    .select("id")
    .eq("patient_id", patientId);
  const caseIds = (caseRows ?? []).map((c: any) => c.id as string);

  let visits: { summaryId: string; whenLabel: string; caseRef: string }[] = [];
  if (caseIds.length > 0) {
    const { data: rows } = await supabase
      .from("visit_summaries")
      .select("id, published_at, visits!inner(scheduled_at, case_id, cases(case_ref))")
      .eq("status", "published")
      .in("visits.case_id", caseIds)
      .order("published_at", { ascending: false });

    visits = (rows ?? []).map((r: any) => ({
      summaryId: r.id as string,
      whenLabel: formatBeirut(r.visits?.scheduled_at ?? r.published_at),
      caseRef: r.visits?.cases?.case_ref ?? "—",
    }));
  }

  const p = patient as { display_label: string; district: string | null };

  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "calc(100vh - 68px)" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          {/* Back link */}
          <Link
            href={`/${locale}/portal`}
            className="mb-4 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:opacity-70"
          >
            ← {t.back}
          </Link>

          {/* Header */}
          <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {t.eyebrow}
          </div>
          <h1
            className="font-display font-medium"
            style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
          >
            {p.display_label}
          </h1>
          <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
            {[p.district, visits[0]?.caseRef].filter(Boolean).join(" · ")}
          </div>

          {/* Visit summaries */}
          <div className="mt-10">
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
              {t.visitsLabel}
            </div>

            {visits.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {visits.map((v, i) => (
                  <li key={v.summaryId}>
                    <Link
                      href={`/${locale}/portal/patients/${patientId}/visits/${v.summaryId}`}
                      className={`flex items-center justify-between gap-4 rounded-xl border border-rule bg-white px-5 py-4 transition hover:border-teal ${
                        i === 0 ? "border-l-2 border-signal" : ""
                      }`}
                    >
                      <div>
                        <div
                          className="font-display font-medium"
                          style={{ fontSize: "18px", letterSpacing: "-0.015em" }}
                        >
                          {v.whenLabel}
                        </div>
                        <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                          {v.caseRef} · {t.readSummary}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {i === 0 ? (
                          <span className="rounded-full bg-teal-soft px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-teal-deep">
                            {t.latest}
                          </span>
                        ) : null}
                        <span aria-hidden="true" className="text-teal" style={{ fontSize: "18px" }}>
                          →
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
                {t.empty}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
