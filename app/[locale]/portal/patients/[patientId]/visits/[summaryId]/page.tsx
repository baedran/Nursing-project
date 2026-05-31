import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { loadSummaryData } from "@/lib/portal/summary";
import VisitSummaryDocument from "@/components/portal/VisitSummaryDocument";

export default async function FamilySummaryPage({
  params,
}: {
  params: Promise<{ locale: string; patientId: string; summaryId: string }>;
}) {
  const { locale, patientId, summaryId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const t = dict.portal.patient;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // portal layout already redirects unauthenticated users

  // RLS guarantees a family can only load its own published summary. Loading
  // returns null when the summary is draft/in-review, belongs to another
  // family, or doesn't exist — all render as 404.
  const doc = await loadSummaryData(supabase, summaryId);
  if (!doc) notFound();

  // Defence-in-depth: make sure this summary actually belongs to the patient
  // in the URL, so the breadcrumb and access intent stay consistent.
  const { data: owner } = await supabase
    .from("visit_summaries")
    .select("visits!inner(cases!inner(patient_id))")
    .eq("id", summaryId)
    .single();
  const ownerPatientId = (owner as any)?.visits?.cases?.patient_id;
  if (ownerPatientId && ownerPatientId !== patientId) notFound();

  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "calc(100vh - 68px)" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          <Link
            href={`/${locale}/portal/patients/${patientId}`}
            className="mb-6 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:opacity-70"
          >
            ← {t.backToPatient}
          </Link>
          <VisitSummaryDocument data={doc.data} />
        </div>
      </div>
    </section>
  );
}
