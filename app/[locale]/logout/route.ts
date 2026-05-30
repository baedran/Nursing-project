import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { pathname, origin } = new URL(request.url);
  const localeMatch = pathname.match(/^\/(en|ar)\//);
  const locale = localeMatch ? localeMatch[1] : "en";

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}/${locale}`, { status: 303 });
}
