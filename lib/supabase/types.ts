/**
 * Placeholder database types.
 *
 * Regenerate from the live database with:
 *   npx supabase gen types typescript --project-id mudjjpnxjjapdcxhhngj > lib/supabase/types.ts
 *
 * Or via the Supabase CLI after `supabase link`:
 *   supabase gen types typescript --local > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
