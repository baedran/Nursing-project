"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type InviteResult =
  | { ok: true; nurseName: string; magicLink: string | null }
  | { ok: false; error: "exists" | "forbidden" | "generic" };

/**
 * Coordinator-only. Creates a passwordless nurse account, promotes the profile
 * to role 'nurse', inserts the nurses row, and mints a one-time magic sign-in
 * link the coordinator can hand to the nurse (e.g. on WhatsApp). Uses the admin
 * (service-role) client — server-only.
 */
export async function inviteNurse(formData: FormData): Promise<InviteResult> {
  const locale = String(formData.get("locale") ?? "en");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const hospital = String(formData.get("hospital") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();

  if (!name || !email) return { ok: false, error: "generic" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "forbidden" };
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "coordinator") return { ok: false, error: "forbidden" };

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: name },
  });

  if (createErr || !created?.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return { ok: false, error: "exists" };
    }
    return { ok: false, error: "generic" };
  }

  const userId = created.user.id;

  const { error: roleErr } = await admin
    .from("profiles")
    .update({ role: "nurse", display_name: name })
    .eq("id", userId);
  const { error: nurseErr } = await admin.from("nurses").insert({
    user_id: userId,
    display_name: name,
    hospital: hospital || null,
    license_number: license || null,
    active: true,
  });

  if (roleErr || nurseErr) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "generic" };
  }

  const hdrs = await headers();
  const origin =
    hdrs.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://nursing-project-olive.vercel.app";
  let magicLink: string | null = null;
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/${locale}/auth/confirm` },
  });
  // Hand the coordinator a link that points at OUR /auth/confirm route with the
  // token as a normal query param (?token_hash=…). The raw `action_link` Supabase
  // returns is its hosted /auth/v1/verify URL, which sends the session back in the
  // URL #hash fragment (implicit flow). A server route handler can't read a #hash
  // (browsers never send it to the server), so that link always failed with
  // "Invalid or expired link" even though the token was valid. The hashed_token
  // form is exactly what @supabase/ssr's server confirm route is built to verify.
  const hashedToken = linkData?.properties?.hashed_token;
  magicLink = hashedToken
    ? `${origin}/${locale}/auth/confirm?token_hash=${hashedToken}&type=magiclink`
    : null;

  revalidatePath(`/${locale}/portal/nurses`);
  return { ok: true, nurseName: name, magicLink };
}
