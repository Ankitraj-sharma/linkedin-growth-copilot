import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables for CLI and background workers
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

let clientInstance: SupabaseClient | null = null
let adminInstance: SupabaseClient | null = null

/**
 * Returns a configured Supabase client instance.
 * Falls back to in-memory mock warning if credentials are missing.
 */
export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) return clientInstance

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '⚠️ [Supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.'
    )
  }

  clientInstance = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
  )
  return clientInstance
}

/**
 * Returns Supabase client with admin privileges (Service Role Key),
 * used by background bot workers to bypass RLS.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (adminInstance) return adminInstance

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ [Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is missing in .env.')
  }

  adminInstance = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseServiceKey || 'placeholder-service-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
  return adminInstance
}
