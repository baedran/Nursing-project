// Dev-only: seed a nurse account + a scheduled visit for the existing Mariam
// case, so the full write loop can be smoke-tested in the browser. Idempotent:
// removes any prior @cc-smoke.test fixtures first. Prints the nurse email,
// nurse user id, and the scheduled visit id as JSON.
//
// Usage: node scripts/seed-smoke.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const raw = readFileSync(resolve(repoRoot, ".env.local"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "smoke_nurse@cc-smoke.test";
const PW = "SmokeNurse1234!pw";

// Clean prior fixtures (visit + nurse + user) — keep the shared Mariam case/patient.
{
  const { data: nurseRow } = await admin.from("nurses").select("id").eq("display_name", "Rita K. (smoke)").maybeSingle();
  if (nurseRow) {
    // delete summaries + visits for that nurse, then the nurse
    const { data: visits } = await admin.from("visits").select("id").eq("assigned_nurse_id", nurseRow.id);
    for (const v of visits ?? []) {
      await admin.from("visit_summaries").delete().eq("visit_id", v.id);
    }
    await admin.from("visits").delete().eq("assigned_nurse_id", nurseRow.id);
    await admin.from("nurses").delete().eq("id", nurseRow.id);
  }
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of list?.users ?? []) {
    if (u.email === EMAIL) await admin.auth.admin.deleteUser(u.id);
  }
}

// Create the nurse auth user (with a password so we can mint a session cookie).
const { data: created, error: cErr } = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PW,
  email_confirm: true,
  user_metadata: { display_name: "Rita K. (smoke)" },
});
if (cErr || !created.user) throw new Error(`createUser: ${cErr?.message}`);
const nurseUserId = created.user.id;
await admin.from("profiles").update({ role: "nurse", display_name: "Rita K. (smoke)" }).eq("id", nurseUserId);
const { data: nurse, error: nErr } = await admin
  .from("nurses")
  .insert({ user_id: nurseUserId, display_name: "Rita K. (smoke)", hospital: "AUBMC", license_number: "RN-SMOKE", active: true })
  .select("id")
  .single();
if (nErr) throw new Error(`nurse insert: ${nErr.message}`);

// Find the existing Mariam case.
const { data: theCase, error: caseErr } = await admin
  .from("cases")
  .select("id, case_ref, patients(display_label)")
  .eq("case_ref", "Case 2026-051")
  .single();
if (caseErr || !theCase) throw new Error(`case lookup: ${caseErr?.message}`);

// Schedule a visit for it, assigned to the smoke nurse.
const { data: visit, error: vErr } = await admin
  .from("visits")
  .insert({
    case_id: theCase.id,
    assigned_nurse_id: nurse.id,
    scheduled_at: new Date(Date.now() - 3600_000).toISOString(),
    status: "scheduled",
  })
  .select("id")
  .single();
if (vErr) throw new Error(`visit insert: ${vErr.message}`);

console.log(JSON.stringify({
  email: EMAIL,
  password: PW,
  nurseUserId,
  nurseId: nurse.id,
  visitId: visit.id,
  caseRef: theCase.case_ref,
}));
