"use server";

import { db } from "@/db";
import { mediaUrl } from "@/lib/media";
import { runAction } from "@/server/action";
import type { FrontEditInput } from "@/server/front-edit/schema";
import { saveFrontEdit as saveFrontEditRecord } from "@/server/front-edit/service";
import { saveUploadedImage } from "@/server/media/service";

// Правка на сайте. Какие поля можно менять — решает схема сервиса, а не клиент.
export async function saveFrontEdit(input: FrontEditInput) {
  return runAction("edit_from_front", () => saveFrontEditRecord(db(), input));
}

// Картинка для блока при правке на сайте. В блок она попадёт, только когда блок сохранят.
export async function uploadFrontEditImage(formData: FormData) {
  return runAction("edit_from_front", async (user) => {
    const image = await saveUploadedImage(db(), formData.get("file"), user.id);
    return { id: image.id, url: mediaUrl(image.storageKey) };
  });
}
