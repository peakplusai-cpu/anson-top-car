import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import {
  isReadOnlyRuntime,
  supabaseAdmin,
  supabaseAdminConfigured,
  supabaseAnonConfigured,
  supabaseConfigured,
  supabasePublic,
} from "./supabase";

export type SiteSettings = {
  lineUrl: string;
  instagramUrl: string;
};

const SETTINGS_PATH = join(process.cwd(), "data", "settings.json");

export const PLACEHOLDER_LINE = "https://line.me/R/ti/p/@ansontopcar";
export const PLACEHOLDER_INSTAGRAM = "https://instagram.com/ansontopcar";

export function defaultSettings(): SiteSettings {
  return {
    lineUrl: process.env.NEXT_PUBLIC_LINE_URL || PLACEHOLDER_LINE,
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || PLACEHOLDER_INSTAGRAM,
  };
}

function normalize(partial: Partial<SiteSettings> & { instagram?: string }): SiteSettings {
  const defaults = defaultSettings();
  const instagramUrl =
    partial.instagramUrl ||
    (partial.instagram ? `https://instagram.com/${String(partial.instagram).replace(/^@/, "")}` : "") ||
    defaults.instagramUrl;
  return {
    lineUrl: String(partial.lineUrl || defaults.lineUrl),
    instagramUrl,
  };
}

export async function getSettings(): Promise<SiteSettings> {
  if (supabaseConfigured()) {
    try {
      if (!supabaseAnonConfigured() && !supabaseAdminConfigured()) return defaultSettings();
      const db = supabasePublic();
      const { data, error } = await db
        .from("site_settings")
        .select("instagram, line_url, instagram_url")
        .eq("id", 1)
        .maybeSingle();
      if (error || !data) return defaultSettings();
      const row = data as { instagram?: string; line_url?: string; instagram_url?: string };
      return normalize({
        lineUrl: row.line_url,
        instagramUrl: row.instagram_url,
        instagram: row.instagram,
      });
    } catch {
      return defaultSettings();
    }
  }
  if (isReadOnlyRuntime()) return defaultSettings();
  try {
    if (!existsSync(SETTINGS_PATH)) {
      const seeded = defaultSettings();
      persist(seeded);
      return seeded;
    }
    const parsed = JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) as Partial<SiteSettings> & {
      instagram?: string;
    };
    return normalize(parsed);
  } catch {
    return defaultSettings();
  }
}

function persist(settings: SiteSettings): void {
  if (isReadOnlyRuntime()) return;
  try {
    mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
    const tmp = `${SETTINGS_PATH}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tmp, JSON.stringify(settings, null, 2), "utf8");
    renameSync(tmp, SETTINGS_PATH);
  } catch (error) {
    console.error("settings persist skipped", error);
  }
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  if (supabaseAdminConfigured()) {
    const { error } = await supabaseAdmin()
      .from("site_settings")
      .upsert({
        id: 1,
        instagram: "",
        line_url: settings.lineUrl,
        instagram_url: settings.instagramUrl,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    return;
  }
  if (supabaseConfigured()) {
    throw new Error("Saving contact URLs needs SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
  }
  persist(settings);
}
