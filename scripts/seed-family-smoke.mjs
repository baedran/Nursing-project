// Dev-only: build a complete FAMILY scenario to smoke-test the read-view.
// Creates a family-role user, a family they own, a patient, a case, a completed
// visit, and a PUBLISHED summary (with an audit event), so logging in as that
// user lands on the family home and can read a real summary.
//
// Idempotent: removes prior @cc-famsmoke.test fixtures first.
// Prints the family user's email + the patient id + summary id as JSON.

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

const DOMAIN = "cc-famsmoke.test";
const FAM_EMAIL = `family@${DOMAIN}`;
const NURSE_EMAIL = `nurse@${DOMAIN}`;
const PW = "FamSmoke1234!pw";

async function cleanup() {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const ids = (list?.users ?? []).filter((u) => u.email?.endsWith(`@${DOMAIN}`)).map((u) => u.id);
  // delete fixtures keyed off these users' families/nurses
  const { data: fams } = await admin
    .from("family_memberships")
    .select("family_id")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const famIds = [...new Set((fams ?? []).map((f) => f.family_id))];
  for (const fid of famIds) {
    const { data: pats } = await admin.from("patients").select("id").eq("family_id", fid);
    for (const p of pats ?? []) {
      const { data: cases } = await admin.from("cases").select("id").eq("patient_id", p.id);
      for (const c of cases ?? []) {
        const { data: vs } = await admin.from("visits").select("id").eq("case_id", c.id);
        for (const v of vs ?? []) await admin.from("visit_summaries").delete().eq("visit_id", v.id);
        await admin.from("visits").delete().eq("case_id", c.id);
      }
      await admin.from("cases").delete().eq("patient_id", p.id);
    }
    await admin.from("patients").delete().eq("family_id", fid);
    await admin.from("family_memberships").delete().eq("family_id", fid);
    await admin.from("families").delete().eq("id", fid);
  }
  for (const id of ids) {
    await admin.from("nurses").delete().eq("user_id", id);
    await admin.auth.admin.deleteUser(id);
  }
}

await cleanup();

// Family-role user (default role from trigger is 'family' — leave as-is)
const { data: fam, error: fe } = await admin.auth.admin.createUser({
  email: FAM_EMAIL, password: PW, email_confirm: true, user_metadata: { display_name: "Family Tester" },
});
if (fe || !fam.user) throw new Error(`family user: ${fe?.message}`);
const familyUserId = fam.user.id;

// Nurse-role user
const { data: nu, error: ne } = await admin.auth.admin.createUser({
  email: NURSE_EMAIL, password: PW, email_confirm: true, user_metadata: { display_name: "Smoke RN" },
});
if (ne || !nu.user) throw new Error(`nurse user: ${ne?.message}`);
await admin.from("profiles").update({ role: "nurse" }).eq("id", nu.user.id);

// Family, membership, patient, case, visit, published summary
const { data: family } = await admin.from("families").insert({ display_name: "Smoke Family" }).select("id").single();
await admin.from("family_memberships").insert({ family_id: family.id, user_id: familyUserId, membership_role: "owner" });
const { data: patient } = await admin.from("patients")
  .insert({ family_id: family.id, display_label: "Mariam", age_band: "70-80", district: "Achrafieh" })
  .select("id").single();
const { data: nurse } = await admin.from("nurses")
  .insert({ user_id: nu.user.id, display_name: "Smoke RN", hospital: "AUBMC", active: true })
  .select("id").single();
// case_ref is UNIQUE across the whole table, so a smoke fixture must not reuse
// a real case ref (e.g. "Case 2026-051" belongs to the live Khoury family).
// Use a timestamped, clearly-fake ref so reseeding never collides.
const caseRef = `SMOKE-${Date.now()}`;
const { data: theCase, error: caseErr } = await admin.from("cases")
  .insert({ patient_id: patient.id, case_ref: caseRef, mode: "shift", status: "active" })
  .select("id").single();
if (caseErr || !theCase) throw new Error(`case insert failed: ${caseErr?.message}`);
const dayAgo = new Date(Date.now() - 86400000).toISOString();
const { data: visit, error: visitErr } = await admin.from("visits")
  .insert({ case_id: theCase.id, scheduled_at: dayAgo, assigned_nurse_id: nurse.id, status: "completed" })
  .select("id").single();
if (visitErr || !visit) throw new Error(`visit insert failed: ${visitErr?.message}`);
const { data: summary } = await admin.from("visit_summaries").insert({
  visit_id: visit.id,
  vitals: { bp: "128/82", hr: "74", spo2: "97", temp: "36.6" },
  done_body: "IV hydration (Normal saline 500 mL over 90 min), vitals check, dressing change on left forearm.",
  observations_body: "Mariam alert, oriented, comfortable at rest. Walked unassisted to the kitchen. Wound healing as expected.",
  meds_administered: ["Vancomycin 1 g IV — no adverse reaction"],
  watch_items: ["Increased redness or warmth at the dressing site", "Fever above 38°C"],
  next_visit_body: "Thursday — same nurse, dressing change + vitals.",
  coordinator_note: "Pharmacy delivered fresh dressings; supply on hand for 5 more changes.",
  status: "published", published_at: new Date().toISOString(), finalised: true,
}).select("id").single();
await admin.from("visit_summary_events").insert({
  visit_summary_id: summary.id, actor_user_id: nu.user.id, from_status: "in_review", to_status: "published",
});

console.log(JSON.stringify({
  familyEmail: FAM_EMAIL, password: PW, patientId: patient.id, summaryId: summary.id,
}));
