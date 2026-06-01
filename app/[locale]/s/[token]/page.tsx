import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary, isLocale } from "@/lib/i18n";
import { loadSummaryByToken } from "@/lib/portal/summary";
import VisitSummaryDocument from "@/components/portal/VisitSummaryDocument";

export default async function SharedSummaryPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const sp = dict.sharePage;

  // Public, no-login. The admin client is used ONLY to resolve this single
  // token; loadSummaryByToken returns null unless the token exists, is
  // unexpired, and its summary is published.
  const admin = createAdminClient();
  const doc = await loadSummaryByToken(admin, token);

  if (!doc) {
    return (
      <section
        className="bg-paper"
        style={{ paddingBlock: "clamp(60px, 10vw, 120px)", minHeight: "100vh" }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
          <div className="mx-auto text-center" style={{ maxWidth: "520px" }}>
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
              {sp.caption}
            </div>
            <h1
              className="font-display font-medium"
              style={{ fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.02em" }}
            >
              {sp.expiredTitle}
            </h1>
            <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">{sp.expiredBody}</p>
          </div>
        </div>
      </section>
    );
  }

  const data = { ...doc.data, printLabel: sp.download };

  return (
    <section
      className="bg-paper"
      style={{ paddingBlock: "clamp(40px, 8vw, 96px)", minHeight: "100vh" }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}>
        <div className="mx-auto" style={{ maxWidth: "760px" }}>
          <div className="print-hidden mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {sp.caption}
          </div>
          <VisitSummaryDocument data={data} />
        </div>
      </div>
    </section>
  );
}
