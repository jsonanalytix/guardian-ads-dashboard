import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const AUTH_STORAGE_KEY = 'guardian-ads-dashboard-auth-token'

// Use a simple in-tab lock to avoid browser Web Locks API acquire timeout issues
// observed in some local dev environments.
const inTabLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => await fn()

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
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: AUTH_STORAGE_KEY,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: inTabLock,
      },
    })
  }
  return browserClient
}
