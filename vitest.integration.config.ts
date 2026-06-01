import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Integration tests (suffix `.itest.ts`) hit the real Supabase project to prove
// Row-Level Security holds. They run in a Node environment (no jsdom) and are
// kept OUT of the default `npm test` unit run — invoke with `npm run test:rls`.
//
// The `@/` alias uses a regex (^@\/) so it only matches project-root paths and
// never captures scoped packages like `@supabase/supabase-js`.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.itest.ts"],
    // RLS setup/teardown is sequential and network-bound; give it room.
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
