"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  if (!email) {
    redirect(`/${locale}/login?error=${encodeURIComponent("Email required.")}`);
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin =
    headerList.get("origin") ??
    (process.env.NEXT_PUBLIC_SITE_URL ??
      "https://nursing-project-olive.vercel.app");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/${locale}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/login?sent=1`);
}
