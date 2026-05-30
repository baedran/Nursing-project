import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { resolveRole } from "@/lib/portal/roles";
import FamilyHome from "@/components/portal/FamilyHome";
import CoordinatorHome from "@/components/portal/CoordinatorHome";
import NurseDashboard from "@/components/portal/NurseDashboard";

export default async function PortalHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const role = resolveRole(profile);
  const displayName = profile?.display_name ?? user.email ?? "—";

  if (role === "coordinator") {
    const { data: rows } = await supabase
      .from("visit_summaries")
      .select(
        "id, status, submitted_at, visits(scheduled_at, nurses(display_name), cases(case_ref, patients(display_label, district)))",
      )
      .in("status", ["submitted", "in_review"])
      .order("submitted_at", { ascending: true });

    const queue = (rows ?? []).map((r: any) => ({
      id: r.id as string,
      patientLabel: r.visits?.cases?.patients?.display_label ?? "—",
      caseRef: r.visits?.cases?.case_ref ?? "—",
      nurseName: r.visits?.nurses?.display_name ?? null,
      visitWhen: r.visits?.scheduled_at
        ? new Date(r.visits.scheduled_at).toLocaleString()
        : "—",
    }));

    return (
      <PortalShell>
        <CoordinatorHome locale={locale} dict={dict} displayName={displayName} queue={queue} />
      </PortalShell>
    );
  }

  if (role === "nurse") {
    const { data: nurseRow } = await supabase
      .from("nurses")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const nurseId = nurseRow?.id ?? "__none__";
    const { data: visitRows } = await supabase
      .from("visits")
      .select(
        "id, scheduled_at, status, cases(case_ref, patients(display_label)), visit_summaries(id, status, sent_back_reason)",
      )
      .eq("assigned_nurse_id", nurseId)
      .order("scheduled_at", { ascending: false });

    const items = (visitRows ?? []).map((v: any) => {
      const summary = Array.isArray(v.visit_summaries) ? v.visit_summaries[0] : v.visit_summaries;
      return {
        visitId: v.id as string,
        summaryId: summary?.id ?? null,
        patientLabel: v.cases?.patients?.display_label ?? "—",
        caseRef: v.cases?.case_ref ?? "—",
        scheduledLabel: v.scheduled_at ? new Date(v.scheduled_at).toLocaleString() : "—",
        status: summary?.status ?? null,
        sentBackReason: summary?.sent_back_reason ?? null,
      };
    });

    const needs = items.filter((i) => i.status === null || i.status === "draft");
    const sentBack = items.filter((i) => i.status === "changes_requested");
    const history = items.filter((i) => ["submitted", "in_review", "published"].includes(i.status ?? ""));

    return (
      <PortalShell>
        <NurseDashboard
          locale={locale} dict={dict} displayName={displayName}
          needs={needs} sentBack={sentBack} history={history}
        />
      </PortalShell>
    );
  }

  const { data: patients } = await supabase
    .from("patients")
    .select("id, display_label, district")
    .is("deleted_at", null);

  return (
    <PortalShell>
      <FamilyHome locale={locale} dict={dict} displayName={displayName} patients={(patients ?? []) as any} />
    </PortalShell>
  );
}

function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "calc(100vh - 68px)" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
        <div className="mx-auto" style={{ maxWidth: "760px" }}>{children}</div>
      </div>
    </section>
  );
}
