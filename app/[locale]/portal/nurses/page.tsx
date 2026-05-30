import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";
import AddNurseForm from "@/components/portal/AddNurseForm";

export default async function NursesPage({
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

  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role ?? "family";
  if (role !== "coordinator") {
    redirect(`/${locale}/portal`);
  }

  const { data: nurses } = await (supabase as any)
    .from("nurses")
    .select("id, display_name, hospital, license_number, active")
    .order("created_at", { ascending: false });

  const nurseList = (nurses as Array<{
    id: string;
    display_name: string;
    hospital: string | null;
    license_number: string | null;
    active: boolean;
  }> | null) ?? [];

  const n = dict.portal.nurses;

  return (
    <section
      className="bg-paper"
      style={{
        paddingBlock: "clamp(60px, 10vw, 120px)",
        minHeight: "calc(100vh - 68px)",
      }}
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
            ← {n.backToPortal}
          </Link>

          {/* Header */}
          <div className="mb-3 mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {n.eyebrow}
          </div>
          <h1
            className="font-display font-medium"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {n.headline}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">{n.lede}</p>

          {/* Roster */}
          <div className="mt-10">
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
              {n.rosterLabel}
            </div>
            {nurseList.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {nurseList.map((nurse) => {
                  const meta = [nurse.hospital, nurse.license_number]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li
                      key={nurse.id}
                      className="rounded-xl border border-rule bg-white px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div
                            className="font-display font-medium"
                            style={{ fontSize: "19px", letterSpacing: "-0.015em" }}
                          >
                            {nurse.display_name}
                          </div>
                          {meta ? (
                            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                              {meta}
                            </div>
                          ) : null}
                        </div>
                        <span
                          className={`mt-0.5 shrink-0 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                            nurse.active
                              ? "bg-teal-soft text-teal-deep"
                              : "bg-paper-cool text-muted"
                          }`}
                        >
                          {nurse.active ? n.active : n.inactive}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
                {n.empty}
              </p>
            )}
          </div>

          {/* Add nurse form */}
          <div className="mt-10">
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
              {n.addLabel}
            </div>
            <AddNurseForm locale={locale} dict={dict} />
          </div>
        </div>
      </div>
    </section>
  );
}
