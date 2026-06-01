import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { loadSummaryData } from "@/lib/portal/summary";
import VisitSummaryDocument from "@/components/portal/VisitSummaryDocument";
import ReviewControls from "@/components/portal/ReviewControls";
import ShareLinkPanel from "@/components/portal/ShareLinkPanel";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ locale: string; summaryId: string }>;
}) {
  const { locale, summaryId } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Coordinator-only guard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as any)?.role !== "coordinator") {
    redirect(`/${locale}/portal`);
  }

  // Move a submitted summary to in_review (safe no-op otherwise)
  await supabase.rpc("open_review", { target_summary_id: summaryId });

  // Load the document
  const doc = await loadSummaryData(supabase, summaryId);
  if (!doc) notFound();

  // Load current status + coordinator_note for the controls
  const { data: summaryMeta } = await supabase
    .from("visit_summaries")
    .select("status, coordinator_note")
    .eq("id", summaryId)
    .single();

  const status = (summaryMeta as any)?.status ?? "in_review";
  const coordinatorNote = (summaryMeta as any)?.coordinator_note ?? "";

  const r = dict.portal.review;

  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "calc(100vh - 68px)" }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          {/* Back link */}
          <Link
            href={`/${locale}/portal`}
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted transition hover:text-ink"
          >
            ← {r.back}
          </Link>

          {/* Eyebrow */}
          <div className="mb-3 mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {r.eyebrow}
          </div>

          {/* The rendered document */}
          <div className="mt-6">
            <VisitSummaryDocument data={doc.data} />
          </div>

          {/* Review controls or published badge */}
          <div className="mt-8">
            {status === "published" ? (
              <>
                <div className="flex flex-col gap-4 rounded-xl border border-teal/40 bg-teal-soft p-5">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                    {r.published}
                  </div>
                  <p className="text-[15px] text-ink">{r.publishedBody}</p>
                  <Link
                    href={`/${locale}/portal`}
                    className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
                  >
                    ← {r.back}
                  </Link>
                </div>
                <div className="mt-4">
                  <ShareLinkPanel
                    locale={locale}
                    dict={dict}
                    summaryId={summaryId}
                    patientLabel={doc.data.patientLabel}
                  />
                </div>
              </>
            ) : (
              <ReviewControls
                locale={locale}
                dict={dict}
                summaryId={summaryId}
                initialNote={coordinatorNote}
                patientLabel={doc.data.patientLabel}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
