import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import { resolveRole } from "@/lib/portal/roles";
import FamilyHome from "@/components/portal/FamilyHome";
import CoordinatorHome from "@/components/portal/CoordinatorHome";
import NurseHome from "@/components/portal/NurseHome";

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
    return (
      <PortalShell>
        <NurseHome dict={dict} displayName={displayName} />
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
