import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
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

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Use redirect() from next/navigation so cookies set by verifyOtp
      // propagate properly. NextResponse.redirect() loses them.
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
