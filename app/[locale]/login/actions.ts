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
      // Invite-only: never create a new account from the login form. Accounts
      // exist only when the coordinator has invited that email. A non-invited
      // address therefore receives no link.
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/${locale}/auth/confirm`,
    },
  });

  // When the email isn't an invited account, Supabase returns an
  // "otp_disabled" / "Signups not allowed" error. We show the SAME confirmation
  // as success on purpose, so the form never reveals who is on the invite list
  // (prevents email-enumeration). Only genuine, unexpected failures surface.
  if (error) {
    const benign =
      error.code === "otp_disabled" ||
      /signups? not allowed|not allowed for otp/i.test(error.message);
    if (!benign) {
      redirect(`/${locale}/login?error=${encodeURIComponent(error.message)}`);
    }
  }

  redirect(`/${locale}/login?sent=1`);
}
