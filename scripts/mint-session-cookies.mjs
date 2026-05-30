// Dev-only helper: mint the exact @supabase/ssr session cookies for a user, so
// a test browser (Playwright) can be dropped straight into an authenticated
// session without the email magic-link round-trip. Sets a temporary password,
// signs in via a server client, and captures the cookies that client writes.
//
// Usage: node scripts/mint-session-cookies.mjs <email>
// Prints a JSON array of { name, value } cookie pairs on stdout.
//
// NOT used in production. The temporary password is random and the account
// keeps working via the normal magic-link flow afterwards.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const raw = readFileSync(resolve(repoRoot, ".env.local"), "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/mint-session-cookies.mjs <email>");
  process.exit(2);
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find the user + set a temporary password.
const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
const user = list?.users?.find((u) => u.email === email);
if (!user) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}
const tempPw = `Tmp_${Math.random().toString(36).slice(2)}_${Date.now()}!A`;
await admin.auth.admin.updateUserById(user.id, { password: tempPw });

// Sign in through a server client whose setAll captures the cookies.
let captured = [];
const server = createServerClient(url, anon, {
  cookies: {
    getAll: () => [],
    setAll: (cookies) => {
      captured = cookies;
    },
  },
});

const { error } = await server.auth.signInWithPassword({ email, password: tempPw });
if (error) {
  console.error(`sign-in failed: ${error.message}`);
  process.exit(1);
}

if (!captured.length) {
  console.error("no cookies captured");
  process.exit(1);
}

console.log(
  JSON.stringify(captured.map(({ name, value }) => ({ name, value }))),
);
