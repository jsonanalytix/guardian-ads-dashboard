import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when Supabase env vars are configured — used to toggle between live and mock data. */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

let browserClient: SupabaseClient | null = null

/**
 * Returns a singleton Supabase client for use in the browser SPA.
 * Uses the public anon key so all queries respect RLS policies.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars'
    )
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}
