import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

export function supabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAnonConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseAdmin(): SupabaseClient {
  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client: RLS applies. Public pages use this to read published cars and settings. */
export function supabasePublic(): SupabaseClient {
  const url = supabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase anon key is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
