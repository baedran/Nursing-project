// Share-link (Option C) integration tests against the real Supabase project.
// Proves the public read path only ever reveals a published, unexpired,
// correctly-tokened summary. @cc-share.test fixtures; self-cleaning.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminClient } from "./helpers";
import { loadSummaryByToken } from "@/lib/portal/summary";
import { generateToken, shareExpiry } from "@/lib/portal/share";

const DOMAIN = "cc-share.test";
const admin = adminClient();

const FAM = "e0000001-0000-4000-8000-000000000001";
const PAT = "e0000001-0000-4000-8000-0000000000a1";
const NURSE = "e0000001-0000-4000-8000-0000000000b1";
const CASE = "e0000001-0000-4000-8000-0000000000c1";
const V_PUB = "e0000001-0000-4000-8000-0000000000d1";
const V_DRAFT = "e0000001-0000-4000-8000-0000000000d2";
const S_PUB = "e0000001-0000-4000-8000-0000000000e1";
const S_DRAFT = "e0000001-0000-4000-8000-0000000000e2";

let nurseUser = "";
const TOK_VALID = generateToken();
const TOK_EXPIRED = generateToken();
const TOK_DRAFT = generateToken();

async function cleanup() {
  await admin.from("summary_share_links").delete().in("token", [TOK_VALID, TOK_EXPIRED, TOK_DRAFT]);
  await admin.from("visit_summaries").delete().in("id", [S_PUB, S_DRAFT]);
  await admin.from("visits").delete().in("id", [V_PUB, V_DRAFT]);
  await admin.from("cases").delete().eq("id", CASE);
  await admin.from("patients").delete().eq("id", PAT);
  await admin.from("nurses").delete().eq("id", NURSE);
  await admin.from("families").delete().eq("id", FAM);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith(`@${DOMAIN}`)) await admin.auth.admin.deleteUser(u.id);
  }
}

beforeAll(async () => {
  await cleanup();
  const { data: nu, error } = await admin.auth.admin.createUser({
    email: `nurse@${DOMAIN}`, password: "ShareTest1234!pw", email_confirm: true,
    user_metadata: { display_name: "Share Nurse" },
  });
  if (error || !nu.user) throw new Error(`createUser: ${error?.message}`);
  nurseUser = nu.user.id;
  await admin.from("profiles").update({ role: "nurse" }).eq("id", nurseUser);

  await admin.from("families").insert({ id: FAM, display_name: "Share Fam" });
  await admin.from("patients").insert({ id: PAT, family_id: FAM, display_label: "Share Patient", district: "Achrafieh" });
  await admin.from("nurses").insert({ id: NURSE, user_id: nurseUser, display_name: "Share Nurse", hospital: "AUBMC", active: true });
  await admin.from("cases").insert({ id: CASE, patient_id: PAT, case_ref: "SHARE-CASE-1", mode: "visit", status: "active" });
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  await admin.from("visits").insert([
    { id: V_PUB, case_id: CASE, scheduled_at: dayAgo, assigned_nurse_id: NURSE, status: "completed" },
    { id: V_DRAFT, case_id: CASE, scheduled_at: dayAgo, assigned_nurse_id: NURSE, status: "completed" },
  ]);
  await admin.from("visit_summaries").insert([
    { id: S_PUB, visit_id: V_PUB, done_body: "published body", status: "published", published_at: new Date().toISOString() },
    { id: S_DRAFT, visit_id: V_DRAFT, done_body: "draft body", status: "draft" },
  ]);
  await admin.from("summary_share_links").insert([
    { token: TOK_VALID, visit_summary_id: S_PUB, expires_at: shareExpiry().toISOString(), created_by: nurseUser },
    { token: TOK_EXPIRED, visit_summary_id: S_PUB, expires_at: new Date(Date.now() - 1000).toISOString(), created_by: nurseUser },
    { token: TOK_DRAFT, visit_summary_id: S_DRAFT, expires_at: shareExpiry().toISOString(), created_by: nurseUser },
  ]);
});

afterAll(async () => { await cleanup(); });

describe("public share read path", () => {
  test("valid token → returns the published summary", async () => {
    const doc = await loadSummaryByToken(admin, TOK_VALID);
    expect(doc).not.toBeNull();
    expect(doc!.data.doneBody).toBe("published body");
  });
  test("expired token → null", async () => {
    expect(await loadSummaryByToken(admin, TOK_EXPIRED)).toBeNull();
  });
  test("token for a non-published summary → null", async () => {
    expect(await loadSummaryByToken(admin, TOK_DRAFT)).toBeNull();
  });
  test("unknown/garbage token → null", async () => {
    expect(await loadSummaryByToken(admin, "totally-not-a-real-token")).toBeNull();
  });
});
