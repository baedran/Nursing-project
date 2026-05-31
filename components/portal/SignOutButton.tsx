import type { Dictionary } from "@/lib/i18n";

// Shared sign-out control for every portal home (family / nurse / coordinator).
// Posts to the locale-aware /logout route, which clears the Supabase session.
export default function SignOutButton({
  locale,
  dict,
}: {
  locale: string;
  dict: Dictionary;
}) {
  return (
    <form action={`/${locale}/logout`} method="post" className="mt-12">
      <button
        type="submit"
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
      >
        ← {dict.portal.logoutLabel}
      </button>
    </form>
  );
}
