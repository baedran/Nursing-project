import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, isLocale } from "@/lib/i18n";

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
  // Layout would have redirected if no user, but TS doesn't know that.
  if (!user) return null;

  // Get the user's profile + memberships + patients accessible to them.
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  const { data: patients } = await (supabase as any)
    .from("patients")
    .select("id, display_label, district, family_id")
    .is("deleted_at", null);

  const displayName =
    (profile as { display_name?: string } | null)?.display_name ??
    user.email ??
    "—";
  const role =
    (profile as { role?: string } | null)?.role ?? "family";

  const patientList = (
    patients as Array<{
      id: string;
      display_label: string;
      district: string;
      family_id: string;
    }> | null
  ) ?? [];

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
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {dict.portal.eyebrow} · {role}
          </div>
          <h1
            className="font-display font-medium"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {dict.portal.headline.replace("{name}", displayName)}
          </h1>

          {/* Patients list */}
          <div className="mt-10">
            <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
              {dict.portal.patientsLabel}
            </div>
            {patientList.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {patientList.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-xl border border-rule bg-white px-5 py-4"
                  >
                    <div
                      className="font-display font-medium"
                      style={{ fontSize: "19px", letterSpacing: "-0.015em" }}
                    >
                      {p.display_label}
                    </div>
                    <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted">
                      {p.district}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-rule bg-paper-cool px-5 py-6 text-[14px] text-ink-soft">
                {dict.portal.emptyPatients}
              </p>
            )}
          </div>

          {/* Sample summary link */}
          <div className="mt-10 rounded-2xl border border-teal/30 bg-teal-soft p-6">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
              {dict.portal.sampleLabel}
            </div>
            <h2
              className="mt-2 font-display font-medium"
              style={{
                fontSize: "20px",
                letterSpacing: "-0.018em",
                lineHeight: 1.2,
              }}
            >
              {dict.portal.sampleHeadline}
            </h2>
            <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">
              {dict.portal.sampleBody}
            </p>
            <Link
              href={`/${locale}/what-we-send`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-paper transition hover:bg-ink-soft"
            >
              {dict.portal.sampleCta} →
            </Link>
          </div>

          {/* Logout */}
          <form
            action={`/${locale}/logout`}
            method="post"
            className="mt-12"
          >
            <button
              type="submit"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
            >
              ← {dict.portal.logoutLabel}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
