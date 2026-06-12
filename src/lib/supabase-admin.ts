import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER ONLY — bypasses RLS.
 * Never import this into a Client Component. Used by trusted server routes
 * (e.g. the payment webhook) that must write regardless of the caller.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
