import { defineConfig } from "vitest/config";

// Integration tests (suffix `.itest.ts`) hit the real Supabase project to prove
// Row-Level Security holds. They run in a Node environment (no jsdom) and are
// kept OUT of the default `npm test` unit run — invoke with `npm run test:rls`.
//
// No `@/` path alias here on purpose: these tests use only relative imports and
// real node_modules (e.g. @supabase/supabase-js), so a broad "@" alias would
// wrongly capture the scoped package name.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.itest.ts"],
    // RLS setup/teardown is sequential and network-bound; give it room.
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
