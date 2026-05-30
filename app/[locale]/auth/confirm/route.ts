import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") as
    | "signup"
    | "magiclink"
    | "recovery"
    | "invite"
    | "email_change"
    | "email"
    | null;
  const next = searchParams.get("next") ?? "/portal";

  // pathname is like /en/auth/confirm — extract locale
  const localeMatch = pathname.match(/^\/(en|ar)\//);
  const locale = localeMatch ? localeMatch[1] : "en";

  const supabase = await createClient();

  // PKCE flow: ?code=...
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(`/${locale}${next}`);
    }
    redirect(
      `/${locale}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // OTP flow: ?token_hash=...&type=...
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(`/${locale}${next}`);
    }
    redirect(
      `/${locale}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect(
    `/${locale}/login?error=${encodeURIComponent("Invalid or expired link.")}`
  );
}
