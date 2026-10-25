import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Abort hung PostgREST calls instead of waiting for the ~14s platform timeout. */
export const SUPABASE_FETCH_MS = 3000;
export const PUBLIC_DATA_TAG = "anson-public";

function supabaseFetch(kind: "public" | "admin", timeoutMs = SUPABASE_FETCH_MS): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const parent = init?.signal;
    if (parent) {
      if (parent.aborted) controller.abort(parent.reason);
      else parent.addEventListener("abort", () => controller.abort(parent.reason), { once: true });
    }
    const method = String(init?.method || "GET").toUpperCase();
    const cacheOpts =
      kind === "public" && method === "GET"
        ? { next: { revalidate: 60, tags: [PUBLIC_DATA_TAG] } }
        : { cache: "no-store" as const };
    return fetch(input, {
      ...init,
      ...cacheOpts,
      signal: controller.signal,
    } as RequestInit).finally(() => clearTimeout(timer));
  };
}

export async function failSoft<T>(work: PromiseLike<T>, fallback: T, ms = SUPABASE_FETCH_MS + 400): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("supabase timeout")), ms);
      }),
    ]);
  } catch (error) {
    console.error("supabase fail-soft", error);
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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

const adminClients = new Map<number, SupabaseClient>();

export function supabaseAdmin(timeoutMs = SUPABASE_FETCH_MS): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseSecretKey();
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }
  const cached = adminClients.get(timeoutMs);
  if (cached) return cached;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: supabaseFetch("admin", timeoutMs) },
  });
  adminClients.set(timeoutMs, client);
  return client;
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
    global: { fetch: supabaseFetch("public") },
  });
}
