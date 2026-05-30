import { createClient as createBaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only admin client. Bypasses Row-Level Security via the service_role key.
 * NEVER import this from a client component. NEVER expose the service_role key to the browser.
 * Use sparingly — only when RLS would block a legitimate operation that's been authorised
 * by application logic.
 */
export function createAdminClient() {
  return createBaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
