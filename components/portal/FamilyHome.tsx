import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import SignOutButton from "@/components/portal/SignOutButton";

type Patient = { id: string; display_label: string; district: string | null };

export default function FamilyHome({
  locale,
  dict,
  displayName,
  patients,
}: {
  locale: string;
  dict: Dictionary;
  displayName: string;
  patients: Patient[];
}) {
  return (
    <>
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
        {dict.portal.eyebrow}
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
        {patients.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {patients.map((p) => (
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
          className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium transition hover:opacity-90"
          style={{ background: "var(--color-ink)", color: "var(--color-paper)" }}
        >
          {dict.portal.sampleCta} →
        </Link>
      </div>

      {/* Sign out */}
      <SignOutButton locale={locale} dict={dict} />
    </>
  );
}
