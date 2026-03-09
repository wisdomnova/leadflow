import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Public/Anonymous Supabase Client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Authenticated Supabase Client
 * Injects the Custom JWT into the Authorization header.
 * This allows Supabase RLS to use our 'org_id' claim.
 */
export const createAuthClient = (token?: string) => {
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers },
  });
};

let adminClient: ReturnType<typeof createClient> | null = null;

/**
 * Admin Supabase Client (Service Role)
 * Bypasses RLS. Use ONLY in secure server-side triggers/CRONs.
 */
export const getAdminClient = () => {
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return adminClient;
};
