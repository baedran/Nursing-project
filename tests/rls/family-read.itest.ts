// Family read-view (slice M) — RLS integration.
//
// Proves the access rules the family read-view relies on:
//   - a family reads its OWN patient's PUBLISHED summary
//   - the same family does NOT see its own DRAFT summary
//   - a different family sees ZERO of the first family's summaries
//   - a different family cannot read the first family's patient row
//
// Runs against the REAL Supabase project. @cc-fam.test fixtures; teardown
// removes only those rows. No real patient data is read or logged.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminClient, signedInClient } from "./helpers";

const PW = "FamRead1234!pw";
const DOMAIN = "cc-fam.test";
const admin = adminClient();

const FAM1 = "d0000001-0000-4000-8000-000000000001";
const FAM2 = "d0000002-0000-4000-8000-000000000002";
const PAT1 = "d0000001-0000-4000-8000-0000000000a1";
const PAT2 = "d0000002-0000-4000-8000-0000000000a2";
const NURSE = "d0000001-0000-4000-8000-0000000000b1";
const CASE1 = "d0000001-0000-4000-8000-0000000000c1";
const VPUB = "d0000001-0000-4000-8000-0000000000d1"; // visit -> published summary
const VDRAFT = "d0000001-0000-4000-8000-0000000000d2"; // visit -> draft summary
const SPUB = "d0000001-0000-4000-8000-0000000000e1";
const SDRAFT = "d0000001-0000-4000-8000-0000000000e2";

let fam1User = "";
let fam2User = "";
let nurseUser = "";

async function cleanup() {
  await admin.from("visit_summaries").delete().in("id", [SPUB, SDRAFT]);
  await admin.from("visits").delete().in("id", [VPUB, VDRAFT]);
  await admin.from("cases").delete().eq("id", CASE1);
  await admin.from("patients").delete().in("id", [PAT1, PAT2]);
  await admin.from("nurses").delete().eq("id", NURSE);
  await admin.from("family_memberships").delete().in("family_id", [FAM1, FAM2]);
  await admin.from("families").delete().in("id", [FAM1, FAM2]);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith(`@${DOMAIN}`)) await admin.auth.admin.deleteUser(u.id);
  }
}

beforeAll(async () => {
  await cleanup();

  for (const key of ["fam1", "fam2", "nurse"] as const) {
    const { data, error } = await admin.auth.admin.createUser({
      email: `${key}@${DOMAIN}`,
      password: PW,
      email_confirm: true,
      user_metadata: { display_name: key },
    });
    if (error || !data.user) throw new Error(`createUser ${key}: ${error?.message}`);
    if (key === "fam1") fam1User = data.user.id;
    if (key === "fam2") fam2User = data.user.id;
    if (key === "nurse") nurseUser = data.user.id;
  }
  await admin.from("profiles").update({ role: "nurse" }).eq("id", nurseUser);

  await admin.from("families").insert([
    { id: FAM1, display_name: "Fam One" },
    { id: FAM2, display_name: "Fam Two" },
  ]);
  await admin.from("family_memberships").insert([
    { family_id: FAM1, user_id: fam1User, membership_role: "owner" },
    { family_id: FAM2, user_id: fam2User, membership_role: "owner" },
  ]);
  await admin.from("patients").insert([
    { id: PAT1, family_id: FAM1, display_label: "Fam1 Patient", district: "Achrafieh" },
    { id: PAT2, family_id: FAM2, display_label: "Fam2 Patient", district: "Hamra" },
  ]);
  await admin.from("nurses").insert({
    id: NURSE, user_id: nurseUser, display_name: "Fam Nurse", hospital: "AUBMC", active: true,
  });
  await admin.from("cases").insert({
    id: CASE1, patient_id: PAT1, case_ref: "Fam Case 1", mode: "visit", status: "active",
  });
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  await admin.from("visits").insert([
    { id: VPUB, case_id: CASE1, scheduled_at: dayAgo, assigned_nurse_id: NURSE, status: "completed" },
    { id: VDRAFT, case_id: CASE1, scheduled_at: dayAgo, assigned_nurse_id: NURSE, status: "completed" },
  ]);
  await admin.from("visit_summaries").insert([
    { id: SPUB, visit_id: VPUB, done_body: "published body", status: "published", published_at: new Date().toISOString() },
    { id: SDRAFT, visit_id: VDRAFT, done_body: "draft body", status: "draft" },
  ]);
});

afterAll(async () => { await cleanup(); });

async function count(client: any, table: string, filter: (q: any) => any) {
  const { count: c, error } = await filter(
    client.from(table).select("*", { count: "exact", head: true }),
  );
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return c ?? 0;
}

describe("family reads its own published summary", () => {
  test("fam1 sees the published summary", async () => {
    const fam1 = await signedInClient(`fam1@${DOMAIN}`, PW);
    expect(await count(fam1, "visit_summaries", (q) => q.eq("id", SPUB))).toBe(1);
  });
  test("fam1 can read its own patient row", async () => {
    const fam1 = await signedInClient(`fam1@${DOMAIN}`, PW);
    expect(await count(fam1, "patients", (q) => q.eq("id", PAT1))).toBe(1);
  });
});

describe("draft summaries stay hidden from family", () => {
  test("fam1 does NOT see its own draft summary", async () => {
    const fam1 = await signedInClient(`fam1@${DOMAIN}`, PW);
    expect(await count(fam1, "visit_summaries", (q) => q.eq("id", SDRAFT))).toBe(0);
  });
  test("fam1 sees exactly one summary total (the published one)", async () => {
    const fam1 = await signedInClient(`fam1@${DOMAIN}`, PW);
    expect(await count(fam1, "visit_summaries", (q) => q)).toBe(1);
  });
});

describe("cross-family isolation", () => {
  test("fam2 sees zero of fam1's summaries", async () => {
    const fam2 = await signedInClient(`fam2@${DOMAIN}`, PW);
    expect(await count(fam2, "visit_summaries", (q) => q.eq("id", SPUB))).toBe(0);
  });
  test("fam2 cannot read fam1's patient row", async () => {
    const fam2 = await signedInClient(`fam2@${DOMAIN}`, PW);
    expect(await count(fam2, "patients", (q) => q.eq("id", PAT1))).toBe(0);
  });
});
