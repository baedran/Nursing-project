import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    // Supabase SQL tests and build output are not Vitest's job.
    exclude: ["node_modules", ".next", "supabase/**", ".superpowers/**"],
  },
  resolve: {
    alias: [
      // Match only "@/..." so the scoped package "@supabase/..." is left alone.
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("./", import.meta.url)),
      },
    ],
  },
});
