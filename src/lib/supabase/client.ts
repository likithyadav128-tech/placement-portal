import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for client components.
 * Uses public environment variables safe for browser exposure.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project")
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : "https://zfouzydarrtqfmrqjvsd.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("placeholder-anon")
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmb3V6eWRhcnJ0cWZtcnFqdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTQ3MzcsImV4cCI6MjEwNDYzMDczN30.juQ-vhvvKx3AysRrRmEZkz5C4dU7TWwh52l8EfvN0QE";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
