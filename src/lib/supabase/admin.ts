import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getPublicSupabaseEnv, getSupabaseServiceRoleKey } from "@/lib/env";

/**
 * Service-role Supabase client (bypasses RLS). Use only in trusted server code
 * for migrations health, ops endpoints, and startup diagnostics.
 */
export function createSupabaseAdminClient(): SupabaseClient | null {
  const key = getSupabaseServiceRoleKey();
  if (!key) return null;
  const { url } = getPublicSupabaseEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
