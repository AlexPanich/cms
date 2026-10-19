"use server";

import { z } from "zod";
import { db } from "@/db";
import { runAction } from "@/server/action";
import type { DocumentInput } from "@/server/documents/schema";
import {
  deleteDocument as deleteDocumentRecord,
  saveUploadedDocument,
  updateDocument as updateDocumentRecord,
} from "@/server/documents/service";

const documentId = z.number().int().positive();

// FormData: file и title. Название проверяет схема сервиса.
export async function createDocument(formData: FormData) {
  return runAction("edit_media", async (user) => {
    const document = await saveUploadedDocument(
      db(),
      formData.get("file"),
      { title: formData.get("title") as string },
      user.id,
    );
    return { id: document.id };
  });
}

export async function updateDocument(id: number, input: DocumentInput) {
  return runAction("edit_media", async () => {
    await updateDocumentRecord(db(), documentId.parse(id), input);
  });
}

export async function deleteDocument(id: number) {
  return runAction("edit_media", () => deleteDocumentRecord(db(), documentId.parse(id)));
}
