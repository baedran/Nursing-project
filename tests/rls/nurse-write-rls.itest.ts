// Nurse-write portal: Row-Level Security + state-machine proof (integration).
//
// Runs against the REAL Supabase project. Proves the access rules from the spec:
//   - a family sees ONLY its own data, and summaries ONLY once published
//   - a nurse sees ONLY her own assigned summaries, and cannot self-publish
//   - only a coordinator can publish / send back
//   - a published summary is locked (nurse edits are silently dropped)
//   - the audit log is append-only (no update, no delete) for everyone
//
// Fixtures use the @cc-rls.test email domain and fixed UUIDs; teardown removes
// ONLY those rows. Run with: npm run test:rls
//
// Reviewer note (PHI): fixtures use fake names/emails. No real patient data is
// read, written, or logged by this suite.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, signedInClient } from "./helpers";

const PW = "RlsTest1234!pw";
const DOMAIN = "cc-rls.test";

// Fixed UUIDs for rows we control (users get server-generated ids).
const F1 = "f0000001-0000-4000-8000-000000000001";
const F2 = "f0000002-0000-4000-8000-000000000002";
const P1 = "f0000001-0000-4000-8000-0000000000a1";
const P2 = "f0000002-0000-4000-8000-0000000000a2";
const NA = "f0000001-0000-4000-8000-0000000000b1";
const NB = "f0000002-0000-4000-8000-0000000000b2";
const C1 = "f0000001-0000-4000-8000-0000000000c1";
const C2 = "f0000002-0000-4000-8000-0000000000c2";
const V1 = "f0000001-0000-4000-8000-0000000000d1";
const V2 = "f0000002-0000-4000-8000-0000000000d2";
const S1 = "f0000001-0000-4000-8000-0000000000e1";
const S2 = "f0000002-0000-4000-8000-0000000000e2";

const EMAILS = {
  coord: `rls_coord@${DOMAIN}`,
  nurseA: `rls_nurseA@${DOMAIN}`,
  nurseB: `rls_nurseB@${DOMAIN}`,
  fam1: `rls_fam1@${DOMAIN}`,
  fam2: `rls_fam2@${DOMAIN}`,
};

const admin = adminClient();
const userIds: Record<string, string> = {};
let coord: SupabaseClient;
let nurseA: SupabaseClient;
let nurseB: SupabaseClient;
let fam1: SupabaseClient;
let fam2: SupabaseClient;

async function count(client: SupabaseClient, table: string, filter?: (q: any) => any) {
  let q = client.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c, error } = await q;
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return c ?? 0;
}

async function cleanup() {
  // Reverse dependency order; only our fixed IDs.
  await admin.from("visit_summaries").delete().in("id", [S1, S2]);
  await admin.from("visits").delete().in("id", [V1, V2]);
  await admin.from("cases").delete().in("id", [C1, C2]);
  await admin.from("patients").delete().in("id", [P1, P2]);
  await admin.from("nurses").delete().in("id", [NA, NB]);
  await admin.from("family_memberships").delete().in("family_id", [F1, F2]);
  await admin.from("families").delete().in("id", [F1, F2]);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email && u.email.endsWith(`@${DOMAIN}`)) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
}

beforeAll(async () => {
  await cleanup();

  // Create auth users (the handle_new_user trigger creates their profiles).
  for (const [key, email] of Object.entries(EMAILS)) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PW,
      email_confirm: true,
      user_metadata: { display_name: key },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    userIds[key] = data.user!.id;
  }

  // Roles
  await admin.from("profiles").update({ role: "coordinator" }).eq("id", userIds.coord);
  await admin.from("profiles").update({ role: "nurse" }).in("id", [userIds.nurseA, userIds.nurseB]);

  // Families + memberships
  await admin.from("families").insert([
    { id: F1, display_name: "RLS Family One" },
    { id: F2, display_name: "RLS Family Two" },
  ]);
  await admin.from("family_memberships").insert([
    { family_id: F1, user_id: userIds.fam1, membership_role: "owner" },
    { family_id: F2, user_id: userIds.fam2, membership_role: "owner" },
  ]);

  // Patients
  await admin.from("patients").insert([
    { id: P1, family_id: F1, display_label: "RLS Mariam", district: "Achrafieh" },
    { id: P2, family_id: F2, display_label: "RLS Georges", district: "Hamra" },
  ]);

  // Nurse provider records
  await admin.from("nurses").insert([
    { id: NA, user_id: userIds.nurseA, display_name: "RLS Nurse A", hospital: "AUBMC", active: true },
    { id: NB, user_id: userIds.nurseB, display_name: "RLS Nurse B", hospital: "Hôtel-Dieu", active: true },
  ]);

  // Cases
  await admin.from("cases").insert([
    { id: C1, patient_id: P1, case_ref: "RLS Case 2026-101", mode: "shift", status: "active" },
    { id: C2, patient_id: P2, case_ref: "RLS Case 2026-102", mode: "visit", status: "active" },
  ]);

  // Visits (V1→Nurse A, V2→Nurse B)
  const day_ago = new Date(Date.now() - 86400000).toISOString();
  await admin.from("visits").insert([
    { id: V1, case_id: C1, scheduled_at: day_ago, assigned_nurse_id: NA, status: "completed" },
    { id: V2, case_id: C2, scheduled_at: day_ago, assigned_nurse_id: NB, status: "completed" },
  ]);

  // Draft summaries
  await admin.from("visit_summaries").insert([
    { id: S1, visit_id: V1, done_body: "orig", status: "draft" },
    { id: S2, visit_id: V2, done_body: "orig2", status: "draft" },
  ]);

  // Signed-in, RLS-bound clients
  coord = await signedInClient(EMAILS.coord, PW);
  nurseA = await signedInClient(EMAILS.nurseA, PW);
  nurseB = await signedInClient(EMAILS.nurseB, PW);
  fam1 = await signedInClient(EMAILS.fam1, PW);
  fam2 = await signedInClient(EMAILS.fam2, PW);
});

afterAll(async () => {
  await cleanup();
});

describe("family read isolation (draft phase)", () => {
  test("1. family one sees no summaries while everything is draft", async () => {
    expect(await count(fam1, "visit_summaries")).toBe(0);
  });
  test("2. family one sees only its own patient", async () => {
    expect(await count(fam1, "patients")).toBe(1);
  });
  test("3. family two sees no draft summaries", async () => {
    expect(await count(fam2, "visit_summaries")).toBe(0);
  });
});

describe("nurse isolation + content edit", () => {
  test("4. assigned nurse sees her own summary", async () => {
    expect(await count(nurseA, "visit_summaries")).toBe(1);
  });
  test("5. nurse cannot see another nurse's visit summary", async () => {
    expect(await count(nurseA, "visit_summaries", (q) => q.eq("visit_id", V2))).toBe(0);
  });
  test("6. nurse can edit her own draft content", async () => {
    const { data, error } = await nurseA
      .from("visit_summaries")
      .update({ done_body: "edited" })
      .eq("id", S1)
      .select();
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
  });
  test("7. nurse cannot raw-update a summary into published", async () => {
    const { error } = await nurseA
      .from("visit_summaries")
      .update({ status: "published" })
      .eq("id", S1)
      .select();
    expect(error).not.toBeNull();
  });
});

describe("state machine + audit", () => {
  test("8. nurse can submit her summary", async () => {
    const { error } = await nurseA.rpc("submit_summary", { target_summary_id: S1 });
    expect(error).toBeNull();
  });
  test("9. status is submitted after submit", async () => {
    const { data } = await admin.from("visit_summaries").select("status").eq("id", S1).single();
    expect(data?.status).toBe("submitted");
  });
  test("10. submit writes one audit event", async () => {
    expect(await count(admin, "visit_summary_events", (q) => q.eq("visit_summary_id", S1))).toBe(1);
  });
  test("11. nurse cannot publish", async () => {
    const { error } = await nurseA.rpc("publish_summary", { target_summary_id: S1 });
    expect(error).not.toBeNull();
  });
  test("12. coordinator can open review", async () => {
    const { error } = await coord.rpc("open_review", { target_summary_id: S1 });
    expect(error).toBeNull();
  });
  test("13. coordinator can publish", async () => {
    const { error } = await coord.rpc("publish_summary", { target_summary_id: S1 });
    expect(error).toBeNull();
  });
  test("14. status is published after publish", async () => {
    const { data } = await admin.from("visit_summaries").select("status").eq("id", S1).single();
    expect(data?.status).toBe("published");
  });
  test("15. published_at is set on publish", async () => {
    const { data } = await admin.from("visit_summaries").select("published_at").eq("id", S1).single();
    expect(data?.published_at).not.toBeNull();
  });
});

describe("published lock + family read", () => {
  test("16. family sees the summary once published", async () => {
    expect(await count(fam1, "visit_summaries")).toBe(1);
  });
  test("17. nurse update on a published summary affects no rows (no error)", async () => {
    const { data, error } = await nurseA
      .from("visit_summaries")
      .update({ done_body: "HACK" })
      .eq("id", S1)
      .select();
    expect(error).toBeNull();
    expect(data?.length).toBe(0);
  });
  test("18. published content cannot be modified by the nurse", async () => {
    const { data } = await admin.from("visit_summaries").select("done_body").eq("id", S1).single();
    expect(data?.done_body).toBe("edited");
  });
});

describe("audit log is append-only", () => {
  test("19+20. audit event cannot be updated (no rows changed)", async () => {
    await coord.from("visit_summary_events").update({ reason: "tamper" }).eq("visit_summary_id", S1);
    expect(await count(admin, "visit_summary_events", (q) => q.eq("reason", "tamper"))).toBe(0);
  });
  test("21+22. audit events cannot be deleted; submit+open_review+publish intact", async () => {
    await coord.from("visit_summary_events").delete().eq("visit_summary_id", S1);
    expect(await count(admin, "visit_summary_events", (q) => q.eq("visit_summary_id", S1))).toBe(3);
  });
  test("23. a family cannot read another family's audit events", async () => {
    expect(await count(fam2, "visit_summary_events", (q) => q.eq("visit_summary_id", S1))).toBe(0);
  });
  test("24. the assigned nurse can read her summary's audit events", async () => {
    expect(
      await count(nurseA, "visit_summary_events", (q) => q.eq("visit_summary_id", S1)),
    ).toBeGreaterThan(0);
  });
});
