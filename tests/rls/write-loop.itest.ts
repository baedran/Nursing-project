// Full write-loop lifecycle integration test.
//
// Runs against the REAL Supabase project. Proves the end-to-end summary
// lifecycle through the Plan-1 RPCs and wound-photo RLS isolation:
//   1. Nurse can INSERT a draft summary for her assigned visit.
//   2. Nurse can UPDATE her draft content.
//   3. Nurse submits via submit_summary RPC → status becomes 'submitted'.
//   4. Coordinator calls open_review → status becomes 'in_review'.
//   5. Coordinator calls publish_summary → status 'published', published_at set; family can read it.
//   6. Coordinator sends back a second submitted summary → 'changes_requested' with reason; nurse can read the reason.
//   7. Wound-photo RLS: nurseA can SELECT her photo (count 1); nurseB (not assigned) gets count 0.
//
// Fixtures use @cc-loop.test email domain and fixed UUIDs (e0000001 prefix).
// Teardown removes ONLY those rows. Run with: npm run test:rls
//
// Reviewer note (PHI): fixtures use fake names/emails. No real patient data.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, signedInClient } from "./helpers";

const PW = "LoopTest1234!pw";
const DOMAIN = "cc-loop.test";

// Fixed UUIDs — prefix e0000001 to avoid collisions with c0000001 / f0000001.
const FAM1  = "e0000001-0000-4000-8000-000000000001";
const FAM2  = "e0000002-0000-4000-8000-000000000002";
const PAT1  = "e0000001-0000-4000-8000-0000000000a1";
const PAT2  = "e0000002-0000-4000-8000-0000000000a2";
const NA    = "e0000001-0000-4000-8000-0000000000b1"; // nurse A provider record
const NB    = "e0000002-0000-4000-8000-0000000000b2"; // nurse B provider record
const C1    = "e0000001-0000-4000-8000-0000000000c1";
const C2    = "e0000002-0000-4000-8000-0000000000c2";
const V1    = "e0000001-0000-4000-8000-0000000000d1"; // visit for nurseA
const V2    = "e0000002-0000-4000-8000-0000000000d2"; // visit for nurseB
// S1 will be inserted by nurseA (test 1); S2 inserted by admin for nurseB lifecycle.
const S1    = "e0000001-0000-4000-8000-0000000000e1";
const S2    = "e0000002-0000-4000-8000-0000000000e2";

const EMAILS = {
  coord:  `loop_coord@${DOMAIN}`,
  nurseA: `loop_nurseA@${DOMAIN}`,
  nurseB: `loop_nurseB@${DOMAIN}`,
  fam1:   `loop_fam1@${DOMAIN}`,
};

const admin = adminClient();
const userIds: Record<string, string> = {};

let coord:  SupabaseClient;
let nurseA: SupabaseClient;
let nurseB: SupabaseClient;
let fam1:   SupabaseClient;

// Helper: count rows visible to a given client.
async function count(
  client: SupabaseClient,
  table: string,
  filter?: (q: any) => any,
): Promise<number> {
  let q = client.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: c, error } = await q;
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return c ?? 0;
}

async function cleanup() {
  // Delete in reverse dependency order; only rows we own.
  await admin.from("wound_photos").delete().in("visit_summary_id", [S1, S2]);
  await admin.from("visit_summaries").delete().in("id", [S1, S2]);
  await admin.from("visits").delete().in("id", [V1, V2]);
  await admin.from("cases").delete().in("id", [C1, C2]);
  await admin.from("patients").delete().in("id", [PAT1, PAT2]);
  await admin.from("nurses").delete().in("id", [NA, NB]);
  await admin.from("family_memberships").delete().in("family_id", [FAM1, FAM2]);
  await admin.from("families").delete().in("id", [FAM1, FAM2]);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith(`@${DOMAIN}`)) {
      await admin.auth.admin.deleteUser(u.id);
    }
  }
}

beforeAll(async () => {
  await cleanup();

  // Auth users (handle_new_user trigger creates their profiles).
  for (const [key, email] of Object.entries(EMAILS)) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { display_name: key },
    });
    if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
    userIds[key] = data.user.id;
    // Set password via updateUserById so sign-in works.
    await admin.auth.admin.updateUserById(data.user.id, { password: PW });
  }

  // Promote roles.
  await admin.from("profiles").update({ role: "coordinator" }).eq("id", userIds.coord);
  await admin
    .from("profiles")
    .update({ role: "nurse" })
    .in("id", [userIds.nurseA, userIds.nurseB]);

  // Families + memberships.
  await admin.from("families").insert([
    { id: FAM1, display_name: "Loop Family One" },
    { id: FAM2, display_name: "Loop Family Two" },
  ]);
  await admin.from("family_memberships").insert([
    { family_id: FAM1, user_id: userIds.fam1, membership_role: "owner" },
  ]);

  // Patients.
  await admin.from("patients").insert([
    { id: PAT1, family_id: FAM1, display_label: "Loop Mariam", district: "Achrafieh" },
    { id: PAT2, family_id: FAM2, display_label: "Loop Georges", district: "Hamra" },
  ]);

  // Nurse provider records.
  await admin.from("nurses").insert([
    { id: NA, user_id: userIds.nurseA, display_name: "Loop Nurse A", hospital: "AUBMC", active: true },
    { id: NB, user_id: userIds.nurseB, display_name: "Loop Nurse B", hospital: "Hôtel-Dieu", active: true },
  ]);

  // Cases.
  await admin.from("cases").insert([
    { id: C1, patient_id: PAT1, case_ref: "Loop Case 2026-201", mode: "visit", status: "active" },
    { id: C2, patient_id: PAT2, case_ref: "Loop Case 2026-202", mode: "visit", status: "active" },
  ]);

  // Completed visits (V1 → nurseA, V2 → nurseB).
  const day_ago = new Date(Date.now() - 86400000).toISOString();
  await admin.from("visits").insert([
    { id: V1, case_id: C1, scheduled_at: day_ago, assigned_nurse_id: NA, status: "completed" },
    { id: V2, case_id: C2, scheduled_at: day_ago, assigned_nurse_id: NB, status: "completed" },
  ]);

  // S2: admin inserts a draft for nurseB (so the send-back test has something to work with).
  // S1 is intentionally NOT inserted here — test 1 proves nurseA can INSERT it.
  await admin.from("visit_summaries").insert({
    id: S2,
    visit_id: V2,
    done_body: "nurseB draft",
    status: "draft",
  });

  // Build RLS-bound signed-in clients.
  coord  = await signedInClient(EMAILS.coord,  PW);
  nurseA = await signedInClient(EMAILS.nurseA, PW);
  nurseB = await signedInClient(EMAILS.nurseB, PW);
  fam1   = await signedInClient(EMAILS.fam1,   PW);
});

afterAll(async () => {
  await cleanup();
});

// ---------------------------------------------------------------------------
// 1. nurseA can INSERT a draft summary for her assigned visit V1.
// ---------------------------------------------------------------------------
describe("1. nurse inserts a draft summary", () => {
  test("nurseA INSERT draft for V1 returns 1 row with no error", async () => {
    const { data, error } = await nurseA
      .from("visit_summaries")
      .insert({ id: S1, visit_id: V1, status: "draft" })
      .select();
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].status).toBe("draft");
  });
});

// ---------------------------------------------------------------------------
// 2. nurseA can UPDATE her draft content.
// ---------------------------------------------------------------------------
describe("2. nurse updates draft content", () => {
  test("nurseA UPDATE done_body on her draft succeeds", async () => {
    const { data, error } = await nurseA
      .from("visit_summaries")
      .update({ done_body: "IV hydration started." })
      .eq("id", S1)
      .select();
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].done_body).toBe("IV hydration started.");
  });
});

// ---------------------------------------------------------------------------
// 3. nurseA submits via RPC → status becomes 'submitted'.
// ---------------------------------------------------------------------------
describe("3. nurse submits her summary", () => {
  test("submit_summary RPC returns no error", async () => {
    const { error } = await nurseA.rpc("submit_summary", { target_summary_id: S1 });
    expect(error).toBeNull();
  });

  test("admin reads status = 'submitted' after submit", async () => {
    const { data } = await admin
      .from("visit_summaries")
      .select("status")
      .eq("id", S1)
      .single();
    expect(data?.status).toBe("submitted");
  });
});

// ---------------------------------------------------------------------------
// 4. Coordinator open_review → status becomes 'in_review'.
// ---------------------------------------------------------------------------
describe("4. coordinator opens review", () => {
  test("open_review RPC returns no error", async () => {
    const { error } = await coord.rpc("open_review", { target_summary_id: S1 });
    expect(error).toBeNull();
  });

  test("admin reads status = 'in_review' after open_review", async () => {
    const { data } = await admin
      .from("visit_summaries")
      .select("status")
      .eq("id", S1)
      .single();
    expect(data?.status).toBe("in_review");
  });
});

// ---------------------------------------------------------------------------
// 5. Coordinator publishes → status 'published', published_at set;
//    familyA (member of patient1's family) can now SELECT the published summary.
// ---------------------------------------------------------------------------
describe("5. coordinator publishes and family can read", () => {
  test("publish_summary RPC returns no error", async () => {
    const { error } = await coord.rpc("publish_summary", { target_summary_id: S1 });
    expect(error).toBeNull();
  });

  test("admin reads status = 'published' after publish", async () => {
    const { data } = await admin
      .from("visit_summaries")
      .select("status")
      .eq("id", S1)
      .single();
    expect(data?.status).toBe("published");
  });

  test("admin reads published_at is not null", async () => {
    const { data } = await admin
      .from("visit_summaries")
      .select("published_at")
      .eq("id", S1)
      .single();
    expect(data?.published_at).not.toBeNull();
  });

  test("fam1 (owner of patient1's family) can SELECT the published summary (count 1)", async () => {
    const c = await count(fam1, "visit_summaries", (q) => q.eq("id", S1));
    expect(c).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 6. send_back_summary on S2: nurseB submits, coordinator sends back;
//    status becomes 'changes_requested' with reason; nurseB can read the reason.
// ---------------------------------------------------------------------------
describe("6. send-back lifecycle on second summary", () => {
  test("nurseB submits S2 via submit_summary RPC", async () => {
    const { error } = await nurseB.rpc("submit_summary", { target_summary_id: S2 });
    expect(error).toBeNull();
  });

  test("coordinator calls send_back_summary with a reason", async () => {
    const { error } = await coord.rpc("send_back_summary", {
      target_summary_id: S2,
      send_back_reason: "add wound measurement",
    });
    expect(error).toBeNull();
  });

  test("admin reads status = 'changes_requested'", async () => {
    const { data } = await admin
      .from("visit_summaries")
      .select("status, sent_back_reason")
      .eq("id", S2)
      .single();
    expect(data?.status).toBe("changes_requested");
    expect(data?.sent_back_reason).toBe("add wound measurement");
  });

  test("nurseB can read sent_back_reason via her RLS client", async () => {
    const { data, error } = await nurseB
      .from("visit_summaries")
      .select("sent_back_reason")
      .eq("id", S2)
      .single();
    expect(error).toBeNull();
    expect(data?.sent_back_reason).toBe("add wound measurement");
  });
});

// ---------------------------------------------------------------------------
// 7. Wound-photo RLS isolation: nurseA sees her photo; nurseB cannot.
// ---------------------------------------------------------------------------
describe("7. wound-photo RLS isolation", () => {
  test("admin inserts a wound_photos row for S1 (no real upload needed)", async () => {
    const { error } = await admin.from("wound_photos").insert({
      visit_summary_id: S1,
      storage_path: `families/${FAM1}/visit-${V1}/test.jpg`,
      caption: "Pre-dressing",
    });
    expect(error).toBeNull();
  });

  test("nurseA (assigned to V1) can SELECT the wound_photos row (count 1)", async () => {
    const c = await count(nurseA, "wound_photos", (q) =>
      q.eq("visit_summary_id", S1),
    );
    expect(c).toBe(1);
  });

  test("nurseB (not assigned to V1) gets count 0 on the same photo", async () => {
    const c = await count(nurseB, "wound_photos", (q) =>
      q.eq("visit_summary_id", S1),
    );
    expect(c).toBe(0);
  });
});
