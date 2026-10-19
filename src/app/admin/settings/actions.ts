"use server";

import { db } from "@/db";
import { mediaUrl } from "@/lib/media";
import { runAction } from "@/server/action";
import { saveUploadedImage } from "@/server/media/service";
import type { SiteSettingsInput } from "@/server/settings/schema";
import { updateSiteSettings as updateSiteSettingsRecord } from "@/server/settings/service";

export async function updateSiteSettings(input: SiteSettingsInput) {
  return runAction("edit_settings", async () => {
    await updateSiteSettingsRecord(db(), input);
  });
}

// Картинка для настроек (логотип). В настройки она попадёт, только когда их сохранят.
export async function uploadSettingsImage(formData: FormData) {
  return runAction("edit_settings", async (user) => {
    const image = await saveUploadedImage(db(), formData.get("file"), user.id);
    return { id: image.id, url: mediaUrl(image.storageKey) };
  });
}
