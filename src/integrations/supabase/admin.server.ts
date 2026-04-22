import { createClient } from "@supabase/supabase-js";

/**
 * Admin (service-role) Supabase client. Server-only — NEVER import from
 * client code. Used for trusted operations like seeding the demo account.
 * Lazily initialized so a missing SUPABASE_SERVICE_ROLE_KEY doesn't crash
 * the server at startup during local development.
 */
let _adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (_adminClient) return _adminClient;
  const url = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin operations.");
  }
  _adminClient = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _adminClient;
}

/** @deprecated Use getSupabaseAdmin() instead */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof ReturnType<typeof createClient>];
  },
});