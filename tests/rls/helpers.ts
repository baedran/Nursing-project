// Shared helpers for RLS integration tests.
//
// These tests run against the REAL Supabase project (no local Docker). They
// create clearly-namespaced fixtures with fixed UUIDs, prove the access rules,
// then delete ONLY those fixtures. They never touch rows they did not create.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

/** Read keys from .env.local (Vitest does not auto-load it). */
export function loadEnv(): {
  url: string;
  anonKey: string;
  serviceKey: string;
} {
  const raw = readFileSync(resolve(repoRoot, ".env.local"), "utf8");
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error(".env.local missing one of URL / ANON_KEY / SERVICE_ROLE_KEY");
  }
  return { url, anonKey, serviceKey };
}

/** Admin client — bypasses RLS via the service-role key. For fixtures only. */
export function adminClient(): SupabaseClient {
  const { url, serviceKey } = loadEnv();
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** A fresh anon client signed in as the given user — subject to RLS. */
export async function signedInClient(
  email: string,
  password: string,
): Promise<SupabaseClient> {
  const { url, anonKey } = loadEnv();
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in failed for ${email}: ${error.message}`);
  return client;
}
