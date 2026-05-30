// Regression test for migration 20260530044515_nurse_read_patient_case.sql.
//
// Bug: the init schema gave nurses a read policy on `visits` but none on
// `cases`/`patients`, so nested selects (visits→cases→patients) returned null
// for nurses and the dashboard/writer rendered "—". This proves an assigned
// nurse CAN read her own patient + case, and a NON-assigned nurse cannot.
//
// Fixtures use @cc-read.test; teardown removes only those rows.

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { adminClient, signedInClient } from "./helpers";

const PW = "ReadTest1234!pw";
const DOMAIN = "cc-read.test";
const admin = adminClient();

const FAM = "a0000001-0000-4000-8000-000000000001";
const PAT = "a0000001-0000-4000-8000-0000000000a1";
const CASE = "a0000001-0000-4000-8000-0000000000c1";
const NURSE_A = "a0000001-0000-4000-8000-0000000000b1";
const NURSE_B = "a0000001-0000-4000-8000-0000000000b2";
let nurseAUser = "";
let nurseBUser = "";

async function cleanup() {
  await admin.from("visits").delete().eq("case_id", CASE);
  await admin.from("cases").delete().eq("id", CASE);
  await admin.from("patients").delete().eq("id", PAT);
  await admin.from("nurses").delete().in("id", [NURSE_A, NURSE_B]);
  await admin.from("families").delete().eq("id", FAM);
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of data?.users ?? []) {
    if (u.email?.endsWith(`@${DOMAIN}`)) await admin.auth.admin.deleteUser(u.id);
  }
}

beforeAll(async () => {
  await cleanup();
  await admin.from("families").insert({ id: FAM, display_name: "Read Fam" });
  await admin.from("patients").insert({ id: PAT, family_id: FAM, display_label: "Read Patient", district: "Achrafieh" });
  await admin.from("cases").insert({ id: CASE, patient_id: PAT, case_ref: "Read Case 1", mode: "visit", status: "active" });

  for (const [key, id] of [["a", NURSE_A], ["b", NURSE_B]] as const) {
    const email = `read_nurse_${key}@${DOMAIN}`;
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password: PW, email_confirm: true, user_metadata: { display_name: `Read Nurse ${key.toUpperCase()}` },
    });
    if (error || !created.user) throw new Error(`createUser ${key}: ${error?.message}`);
    if (key === "a") nurseAUser = created.user.id; else nurseBUser = created.user.id;
    await admin.from("profiles").update({ role: "nurse" }).eq("id", created.user.id);
    await admin.from("nurses").insert({ id, user_id: created.user.id, display_name: `Read Nurse ${key.toUpperCase()}`, hospital: "AUBMC", active: true });
  }

  // Visit assigned ONLY to nurse A.
  await admin.from("visits").insert({
    case_id: CASE, scheduled_at: new Date().toISOString(), assigned_nurse_id: NURSE_A, status: "scheduled",
  });
});

afterAll(async () => { await cleanup(); });

describe("nurse can read her assigned patient + case", () => {
  test("assigned nurse reads the patient row", async () => {
    const nurse = await signedInClient(`read_nurse_a@${DOMAIN}`, PW);
    const { data } = await nurse.from("patients").select("display_label").eq("id", PAT);
    expect(data?.length).toBe(1);
    expect(data?.[0].display_label).toBe("Read Patient");
  });
  test("assigned nurse reads the case row", async () => {
    const nurse = await signedInClient(`read_nurse_a@${DOMAIN}`, PW);
    const { data } = await nurse.from("cases").select("case_ref").eq("id", CASE);
    expect(data?.length).toBe(1);
    expect(data?.[0].case_ref).toBe("Read Case 1");
  });
});

describe("a non-assigned nurse cannot", () => {
  test("non-assigned nurse cannot read the patient", async () => {
    const nurse = await signedInClient(`read_nurse_b@${DOMAIN}`, PW);
    const { data } = await nurse.from("patients").select("display_label").eq("id", PAT);
    expect(data?.length).toBe(0);
  });
  test("non-assigned nurse cannot read the case", async () => {
    const nurse = await signedInClient(`read_nurse_b@${DOMAIN}`, PW);
    const { data } = await nurse.from("cases").select("case_ref").eq("id", CASE);
    expect(data?.length).toBe(0);
  });
});
