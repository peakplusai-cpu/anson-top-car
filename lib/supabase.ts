import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function firstEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

/** True on Vercel / other read-only serverless filesystems. */
export function isReadOnlyRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.NOW_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function supabaseUrl(): string {
  return firstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL").replace(/\/$/, "");
}

/**
 * Public/low-privilege key: legacy JWT `eyJ…` (anon) or `sb_publishable_…`.
 * Also reads the dashboard’s newer env names.
 */
export function supabaseAnonKey(): string {
  return firstEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY"
  );
}

/**
 * Server key: legacy JWT `eyJ…` (service_role) or `sb_secret_…`.
 */
export function supabaseSecretKey(): string {
  return firstEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_KEY");
}

/** Prefer Supabase whenever the project URL is set — never JSON files on Vercel. */
export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl());
}

export function supabaseAdminConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseSecretKey());
}

export function supabaseAnonConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export function supabaseAdmin(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseSecretKey();
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon/publishable client: RLS applies. Public pages use this to read published cars and settings. */
export function supabasePublic(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseAnonKey() || supabaseSecretKey();
  if (!url || !key) {
    throw new Error("Supabase anon key is not configured");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
