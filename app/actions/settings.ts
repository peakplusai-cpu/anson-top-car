"use server";

import { revalidatePublic } from "@/lib/revalidate-public";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { parseContactUrl } from "@/lib/contacts";
import { getSettings, saveSettings } from "@/lib/settings";
import { parseFeaturedVideoUrl } from "@/lib/video";

export async function saveContacts(formData: FormData) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const line = parseContactUrl(String(formData.get("lineUrl") ?? ""), "line");
  const ig = parseContactUrl(String(formData.get("instagramUrl") ?? ""), "instagram");
  const video = parseFeaturedVideoUrl(String(formData.get("featuredVideoUrl") ?? ""));
  if (!line.ok) redirect("/admin/settings?error=line");
  if (!ig.ok) redirect("/admin/settings?error=instagram");
  if (!video.ok) redirect("/admin/settings?error=video");

  try {
    const current = await getSettings();
    await saveSettings({
      ...current,
      lineUrl: line.url,
      instagramUrl: ig.url,
      featuredVideoUrl: video.url,
      featuredVideoCaption: String(formData.get("featuredVideoCaption") ?? "").trim().slice(0, 280),
    });
  } catch {
    redirect("/admin/settings?error=save");
  }
  revalidatePublic(["/admin/settings"]);
  redirect("/admin/settings?saved=1");
}
