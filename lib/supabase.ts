// lib/supabase.ts - UPDATED VERSION
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Export singleton instance (keep for backwards compatibility)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

// Export factory function (for new code)
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

// Export service role client for server-side operations
export function createServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service client should only be used server-side')
  }
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}