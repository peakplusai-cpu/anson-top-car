"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { parseContactUrl } from "@/lib/contacts";
import { getSettings, saveSettings } from "@/lib/settings";

export async function saveContacts(formData: FormData) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  const line = parseContactUrl(String(formData.get("lineUrl") ?? ""), "line");
  const ig = parseContactUrl(String(formData.get("instagramUrl") ?? ""), "instagram");
  if (!line.ok) redirect("/admin/settings?error=line");
  if (!ig.ok) redirect("/admin/settings?error=instagram");

  try {
    const current = await getSettings();
    await saveSettings({
      ...current,
      lineUrl: line.url,
      instagramUrl: ig.url,
    });
  } catch {
    redirect("/admin/settings?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
