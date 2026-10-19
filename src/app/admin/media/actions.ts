"use server";

import { z } from "@/lib/zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import { deleteImage as deleteImageRecord } from "@/server/media/service";

const recordId = z.number().int().positive();

export async function deleteImage(id: number) {
  return runAction("edit_media", () => deleteImageRecord(db(), recordId.parse(id)));
}
