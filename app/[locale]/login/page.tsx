import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { sendMagicLink } from "./actions";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { sent, error } = await searchParams;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <section
      className="bg-paper-cool"
      style={{
        paddingBlock: "clamp(72px, 12vw, 140px)",
        minHeight: "calc(100vh - 68px)",
      }}
    >
      <div
        className="mx-auto flex min-h-full flex-col justify-center"
        style={{ maxWidth: "var(--shell-max)", paddingInline: "var(--pad-x)" }}
      >
        <div className="mx-auto w-full" style={{ maxWidth: "440px" }}>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-teal-deep">
            {dict.login.eyebrow}
          </div>
          <h1
            className="font-display font-medium"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {dict.login.headline}{" "}
            <em className="text-teal" style={{ fontStyle: "italic" }}>
              {dict.login.headlineEm}
            </em>
          </h1>
          <p className="mt-4 text-[15px] leading-[1.6] text-ink-soft">
            {dict.login.lede}
          </p>

          {sent === "1" ? (
            <div className="mt-8 rounded-xl border border-teal/40 bg-teal-soft p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-teal-deep">
                {dict.login.successLabel}
              </div>
              <h2
                className="mt-2 font-display font-medium"
                style={{
                  fontSize: "20px",
                  letterSpacing: "-0.018em",
                  lineHeight: 1.2,
                }}
              >
                {dict.login.successHeadline}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.55] text-ink-soft">
                {dict.login.successBody}
              </p>
            </div>
          ) : (
            <form action={sendMagicLink} className="mt-8 flex flex-col gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">
                  {dict.login.emailLabel}
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="rounded-lg border border-rule bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-teal"
                />
              </label>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-4 text-[15px] font-medium text-paper transition hover:-translate-y-0.5 hover:bg-ink-soft"
              >
                {dict.login.submitLabel} →
              </button>
              {error ? (
                <div className="mt-2 rounded-md border border-peach bg-peach/10 px-3 py-2 text-[13px] text-ink">
                  {decodeURIComponent(error)}
                </div>
              ) : null}
              <p className="mt-2 text-[12.5px] leading-[1.6] text-muted">
                {dict.login.helper}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
