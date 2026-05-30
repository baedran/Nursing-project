import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import ScheduleVisitForm from "@/components/portal/ScheduleVisitForm";

export default async function SchedulePage({
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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "coordinator") redirect(`/${locale}/portal`);

  const { data: cases } = await supabase
    .from("cases")
    .select("id, case_ref, patients(display_label, district)")
    .eq("status", "active");

  const { data: nurses } = await supabase
    .from("nurses")
    .select("id, display_name, hospital")
    .eq("active", true);

  const caseOptions = (cases ?? []).map((c: any) => ({
    caseId: c.id,
    label: `${c.patients?.display_label ?? "—"} · ${c.case_ref}`,
  }));

  const nurseOptions = (nurses ?? []).map((n: any) => ({
    nurseId: n.id,
    label: `${n.display_name}${n.hospital ? " · " + n.hospital : ""}`,
  }));

  const s = dict.portal.schedule;

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
          <Link
            href={`/${locale}/portal`}
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted transition hover:text-ink"
          >
            ← {s.backToPortal}
          </Link>

          <div className="mt-6 mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {s.eyebrow}
          </div>
          <h1
            className="font-display font-medium"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {s.headline}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">{s.lede}</p>

          <div className="mt-10">
            {nurseOptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
                <p>{s.noNurses}</p>
                <Link
                  href={`/${locale}/portal/nurses`}
                  className="mt-3 inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep transition hover:opacity-70"
                >
                  → {dict.portal.coordinator.manageNursesLabel}
                </Link>
              </div>
            ) : caseOptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
                {s.noCases}
              </div>
            ) : (
              <ScheduleVisitForm
                locale={locale}
                dict={dict}
                cases={caseOptions}
                nurses={nurseOptions}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
