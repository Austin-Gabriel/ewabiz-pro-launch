import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL as string;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Admin (service-role) Supabase client. Server-only — NEVER import from
 * client code. Used for trusted operations like seeding the demo account.
 */
export const supabaseAdmin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});