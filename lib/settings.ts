import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "fs";
import { unstable_cache } from "next/cache";
import { dirname, join } from "path";
import {
  PUBLIC_DATA_TAG,
  failSoft,
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
  featuredVideoUrl: string;
  featuredVideoCaption: string;
};

const SETTINGS_PATH = join(process.cwd(), "data", "settings.json");

export const PLACEHOLDER_LINE = "https://line.me/R/ti/p/@ansontopcar";
export const PLACEHOLDER_INSTAGRAM = "https://instagram.com/ansontopcar";

export function defaultSettings(): SiteSettings {
  return {
    lineUrl: process.env.NEXT_PUBLIC_LINE_URL || PLACEHOLDER_LINE,
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || PLACEHOLDER_INSTAGRAM,
    featuredVideoUrl: "",
    featuredVideoCaption: "",
  };
}

function videoFromLegacy(instagram?: string): { url: string; caption: string } {
  const raw = (instagram || "").trim();
  if (!raw || raw.startsWith("@") || /^[A-Za-z0-9._]{1,30}$/.test(raw)) return { url: "", caption: "" };
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as { v?: string; url?: string; c?: string; caption?: string };
      return { url: String(parsed.v || parsed.url || ""), caption: String(parsed.c || parsed.caption || "") };
    } catch {
      return { url: "", caption: "" };
    }
  }
  return { url: raw, caption: "" };
}

function videoPack(settings: SiteSettings): string {
  if (!settings.featuredVideoUrl && !settings.featuredVideoCaption) return "";
  return JSON.stringify({ v: settings.featuredVideoUrl, c: settings.featuredVideoCaption });
}

function normalize(partial: Partial<SiteSettings> & { instagram?: string }): SiteSettings {
  const defaults = defaultSettings();
  const packed = videoFromLegacy(partial.instagram);
  const instagramLooksLikeAccount =
    Boolean(partial.instagram) &&
    !String(partial.instagram).trim().startsWith("{") &&
    !String(partial.instagram).includes("http") &&
    !String(partial.instagram).includes("/");
  const instagramUrl =
    partial.instagramUrl ||
    (instagramLooksLikeAccount
      ? `https://instagram.com/${String(partial.instagram).replace(/^@/, "")}`
      : "") ||
    defaults.instagramUrl;
  return {
    lineUrl: String(partial.lineUrl || defaults.lineUrl),
    instagramUrl,
    featuredVideoUrl: String(partial.featuredVideoUrl || packed.url || ""),
    featuredVideoCaption: String(partial.featuredVideoCaption || packed.caption || ""),
  };
}

const cachedRemoteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    if (!supabaseAnonConfigured() && !supabaseAdminConfigured()) return defaultSettings();
    const row = await failSoft(
      supabasePublic()
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error || !data) return null;
          return data as {
            instagram?: string;
            line_url?: string;
            instagram_url?: string;
            featured_video_url?: string;
            featured_video_caption?: string;
          };
        }),
      null
    );
    if (!row) return defaultSettings();
    return normalize({
      lineUrl: row.line_url,
      instagramUrl: row.instagram_url,
      instagram: row.instagram,
      featuredVideoUrl: row.featured_video_url,
      featuredVideoCaption: row.featured_video_caption,
    });
  },
  ["anson-public-settings"],
  { revalidate: 60, tags: [PUBLIC_DATA_TAG] }
);

export async function getSettings(): Promise<SiteSettings> {
  if (supabaseConfigured()) {
    try {
      return await cachedRemoteSettings();
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
        instagram: videoPack(settings),
        line_url: settings.lineUrl,
        instagram_url: settings.instagramUrl,
        featured_video_url: settings.featuredVideoUrl,
        featured_video_caption: settings.featuredVideoCaption,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      const { error: fallback } = await supabaseAdmin()
        .from("site_settings")
        .upsert({
          id: 1,
          instagram: videoPack(settings),
          line_url: settings.lineUrl,
          instagram_url: settings.instagramUrl,
          updated_at: new Date().toISOString(),
        });
      if (fallback) throw error;
    }
    return;
  }
  if (supabaseConfigured()) {
    throw new Error("Saving contact URLs needs SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
  }
  persist(settings);
}
