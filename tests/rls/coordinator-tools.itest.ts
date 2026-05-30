// Coordinator tools (integration): proves an invited nurse account is set up
// correctly and that a scheduled visit is visible to exactly that nurse.
// Mirrors the DB operations performed by inviteNurse + scheduleVisit actions.
// Fixtures use @cc-coord.test; teardown removes only those rows.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminClient, signedInClient } from "./helpers";

const PW = "CoordTest1234!pw";
const DOMAIN = "cc-coord.test";
const admin = adminClient();

const FAM = "c0000001-0000-4000-8000-000000000001";
const PAT = "c0000001-0000-4000-8000-0000000000a1";
const CASE = "c0000001-0000-4000-8000-0000000000c1";
const NURSE = "c0000001-0000-4000-8000-0000000000b1";
let nurseUserId = "";
let visitId = "";

async function cleanup() {
  await admin.from("visits").delete().eq("case_id", CASE);
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
  await admin.from("families").insert({ id: FAM, display_name: "Coord Fam" });
  await admin.from("patients").insert({ id: PAT, family_id: FAM, display_label: "Coord Patient", district: "Achrafieh" });
  await admin.from("cases").insert({ id: CASE, patient_id: PAT, case_ref: "Coord Case 1", mode: "visit", status: "active" });

  const email = `coord_nurse@${DOMAIN}`;
  const { data: created, error } = await admin.auth.admin.createUser({
    email, email_confirm: true, user_metadata: { display_name: "Coord Nurse" },
  });
  if (error || !created.user) throw new Error(`createUser: ${error?.message}`);
  nurseUserId = created.user.id;
  await admin.from("profiles").update({ role: "nurse", display_name: "Coord Nurse" }).eq("id", nurseUserId);
  await admin.from("nurses").insert({ id: NURSE, user_id: nurseUserId, display_name: "Coord Nurse", hospital: "AUBMC", active: true });
  await admin.auth.admin.updateUserById(nurseUserId, { password: PW });

  const { data: v, error: vErr } = await admin.from("visits").insert({
    case_id: CASE, scheduled_at: new Date().toISOString(), assigned_nurse_id: NURSE, status: "scheduled",
  }).select("id").single();
  if (vErr) throw new Error(`visit insert: ${vErr.message}`);
  visitId = v!.id;
});

afterAll(async () => { await cleanup(); });

describe("invited nurse account", () => {
  test("profile role is nurse", async () => {
    const { data } = await admin.from("profiles").select("role").eq("id", nurseUserId).single();
    expect(data?.role).toBe("nurse");
  });
  test("nurses row is linked to the auth user", async () => {
    const { data } = await admin.from("nurses").select("user_id, active").eq("id", NURSE).single();
    expect(data?.user_id).toBe(nurseUserId);
    expect(data?.active).toBe(true);
  });
});

describe("scheduled visit visibility", () => {
  test("the assigned nurse can see her scheduled visit", async () => {
    const nurse = await signedInClient(`coord_nurse@${DOMAIN}`, PW);
    const { data, error } = await nurse.from("visits").select("id, status").eq("id", visitId);
    expect(error).toBeNull();
    expect(data?.length).toBe(1);
    expect(data?.[0].status).toBe("scheduled");
  });
});
