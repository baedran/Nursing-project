import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import SummaryForm from "@/components/portal/SummaryForm";

export default async function SummaryWriterPage({
  params,
}: {
  params: Promise<{ locale: string; visitId: string }>;
}) {
  const { locale, visitId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Confirm the user is the assigned nurse for this visit and load context.
  const { data: visit } = await supabase
    .from("visits")
    .select(
      "id, scheduled_at, assigned_nurse_id, cases(case_ref, patients(display_label, district, family_id)), nurses!visits_assigned_nurse_id_fkey(user_id)",
    )
    .eq("id", visitId)
    .single();

  const nurseData = visit?.nurses as any;
  const nurseUserId = Array.isArray(nurseData) ? nurseData[0]?.user_id : nurseData?.user_id;

  if (!visit || nurseUserId !== user.id) {
    redirect(`/${locale}/portal`);
  }

  const caseData = visit.cases as any;
  const patientData = caseData?.patients as any;
  const patientLabel: string = patientData?.display_label ?? "—";
  const district: string | null = patientData?.district ?? null;
  const caseRef: string = caseData?.case_ref ?? "—";
  const familyId: string = patientData?.family_id ?? "";
  const visitScheduledAt: string | null = visit.scheduled_at ?? null;

  // Find-or-create the draft summary.
  let { data: summary } = await supabase
    .from("visit_summaries")
    .select(
      "id, status, vitals, done_body, observations_body, meds_administered, watch_items, next_visit_body, sent_back_reason",
    )
    .eq("visit_id", visitId)
    .maybeSingle();

  if (!summary) {
    const { data: created } = await supabase
      .from("visit_summaries")
      .insert({ visit_id: visitId, status: "draft" })
      .select(
        "id, status, vitals, done_body, observations_body, meds_administered, watch_items, next_visit_body, sent_back_reason",
      )
      .single();
    summary = created;
  }

  if (!summary) {
    // Couldn't create summary — shouldn't happen with proper RLS
    return (
      <div className="p-8 text-ink">
        <p>Could not load or create a summary for this visit.</p>
        <Link href={`/${locale}/portal`} className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal-deep hover:opacity-70">
          {dict.portal.writer.back}
        </Link>
      </div>
    );
  }

  const s = summary as any;

  // Read-only states — nurse cannot edit.
  const readOnlyStatuses = ["submitted", "in_review", "published"];
  if (readOnlyStatuses.includes(s.status)) {
    return (
      <section
        className="bg-paper"
        style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "calc(100vh - 68px)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
          <div className="mx-auto" style={{ maxWidth: "760px" }}>
            <div className="rounded-xl border border-rule bg-white px-6 py-8 text-center">
              <div className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                {patientLabel} · {caseRef}
              </div>
              <p className="text-[15px] text-ink-soft">
                {s.status === "published"
                  ? dict.portal.writer.readOnlyPublishedBody
                  : dict.portal.writer.readOnlySubmittedBody}
              </p>
              <Link
                href={`/${locale}/portal`}
                className="mt-6 inline-block font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
              >
                ← {dict.portal.writer.back}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Load existing wound photos and sign URLs for preview.
  const { data: photoRows } = await supabase
    .from("wound_photos")
    .select("id, storage_path, caption")
    .eq("visit_summary_id", s.id);

  const initialPhotos: { id: string; caption: string; url: string }[] = [];
  for (const p of photoRows ?? []) {
    const pr = p as any;
    const { data: signed } = await supabase.storage
      .from("wound-photos")
      .createSignedUrl(pr.storage_path, 3600);
    if (signed?.signedUrl) {
      initialPhotos.push({
        id: pr.id,
        caption: pr.caption ?? "",
        url: signed.signedUrl,
      });
    }
  }

  const vitals = (s.vitals as Record<string, string> | null) ?? { bp: "", hr: "", spo2: "", temp: "" };

  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "calc(100vh - 68px)" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          <SummaryForm
            locale={locale}
            dict={dict}
            summaryId={s.id}
            visitId={visitId}
            familyId={familyId}
            initial={{
              bp: vitals.bp ?? "",
              hr: vitals.hr ?? "",
              spo2: vitals.spo2 ?? "",
              temp: vitals.temp ?? "",
              doneBody: s.done_body ?? "",
              observationsBody: s.observations_body ?? "",
              meds: (s.meds_administered as string[] | null) ?? [],
              watchItems: (s.watch_items as string[] | null) ?? [],
              nextVisitBody: s.next_visit_body ?? "",
            }}
            sentBackReason={(s.sent_back_reason as string | null) ?? null}
            patientLabel={patientLabel}
            district={district}
            caseRef={caseRef}
            visitScheduledAt={visitScheduledAt}
            initialPhotos={initialPhotos}
          />
        </div>
      </div>
    </section>
  );
}
