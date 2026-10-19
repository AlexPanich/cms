"use server";

import { z } from "zod";
import { db } from "@/db";
import { mediaUrl } from "@/lib/media";
import { runAction } from "@/server/action";
import type { GalleryInput } from "@/server/galleries/schema";
import {
  createGallery as createGalleryRecord,
  deleteGallery as deleteGalleryRecord,
  removeGalleryImage as removeGalleryImageRecord,
  reorderGalleryImages as reorderGalleryImageRecords,
  updateGallery as updateGalleryRecord,
  uploadGalleryImage as uploadGalleryImageRecord,
} from "@/server/galleries/service";
import type { ImageInfoInput } from "@/server/media/schema";
import { updateImageInfo } from "@/server/media/service";

const recordId = z.number().int().positive();

export async function createGallery(input: GalleryInput) {
  return runAction("edit_media", async () => {
    const gallery = await createGalleryRecord(db(), input);
    return { id: gallery.id };
  });
}

export async function updateGallery(id: number, input: GalleryInput) {
  return runAction("edit_media", async () => {
    await updateGalleryRecord(db(), recordId.parse(id), input);
  });
}

export async function deleteGallery(id: number) {
  return runAction("edit_media", () => deleteGalleryRecord(db(), recordId.parse(id)));
}

// Один файл за вызов: клиент отправляет выбранные файлы по очереди.
export async function uploadGalleryImage(galleryId: number, formData: FormData) {
  return runAction("edit_media", async (user) => {
    const image = await uploadGalleryImageRecord(
      db(),
      recordId.parse(galleryId),
      formData.get("file"),
      user.id,
    );
    return { id: image.id, url: mediaUrl(image.storageKey) };
  });
}

export async function removeGalleryImage(galleryId: number, mediaId: number) {
  return runAction("edit_media", () =>
    removeGalleryImageRecord(db(), recordId.parse(galleryId), recordId.parse(mediaId)),
  );
}

export async function reorderGalleryImages(galleryId: number, orderedMediaIds: number[]) {
  return runAction("edit_media", () =>
    reorderGalleryImageRecords(
      db(),
      recordId.parse(galleryId),
      z.array(recordId).parse(orderedMediaIds),
    ),
  );
}

export async function updateGalleryImageInfo(mediaId: number, input: ImageInfoInput) {
  return runAction("edit_media", async () => {
    await updateImageInfo(db(), recordId.parse(mediaId), input);
  });
}
