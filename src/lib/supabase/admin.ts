import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates an elevated administrative Supabase client using the Service Role Key.
 *
 * SECURITY NOTICE:
 * This client bypasses Row Level Security (RLS) policies.
 * It must NEVER be imported or executed in client components or browser bundles.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not defined. Admin operations cannot be performed without service role credentials."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
