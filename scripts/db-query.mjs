#!/usr/bin/env node
// Run SQL against the Supabase project via the Management API.
//
// Auth: reads a Supabase personal access token from the SUPABASE_ACCESS_TOKEN
// env var, or falls back to the gitignored `.supabase-token` file at repo root.
// Project ref: SUPABASE_PROJECT_REF env var, or the default below.
//
// Usage:
//   node scripts/db-query.mjs path/to/file.sql      # run a .sql file
//   node scripts/db-query.mjs -e "select now();"     # run an inline statement
//
// This is a thin operational helper for applying migrations and ad-hoc queries
// without Docker or the database password. It prints the JSON result.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function getToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN.trim();
  try {
    return readFileSync(resolve(repoRoot, ".supabase-token"), "utf8").trim();
  } catch {
    throw new Error(
      "No token: set SUPABASE_ACCESS_TOKEN or create .supabase-token at repo root",
    );
  }
}

const ref = process.env.SUPABASE_PROJECT_REF ?? "mudjjpnxjjapdcxhhngj";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/db-query.mjs <file.sql> | -e \"<sql>\"");
  process.exit(2);
}

let query;
if (args[0] === "-e") {
  query = args.slice(1).join(" ");
} else {
  query = readFileSync(resolve(process.cwd(), args[0]), "utf8");
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  },
);

const text = await res.text();
if (!res.ok) {
  console.error(`HTTP ${res.status}`);
  console.error(text);
  process.exit(1);
}
console.log(text);
