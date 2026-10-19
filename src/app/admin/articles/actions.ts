"use server";

import { z } from "@/lib/zod";
import { db } from "@/db";
import { mediaUrl } from "@/lib/media";
import { runAction } from "@/server/action";
import type { ArticleInput } from "@/server/articles/schema";
import {
  createArticle as createArticleRecord,
  deleteArticle as deleteArticleRecord,
  updateArticle as updateArticleRecord,
} from "@/server/articles/service";
import { saveUploadedImage } from "@/server/media/service";

const articleId = z.number().int().positive();

export async function createArticle(input: ArticleInput) {
  return runAction("edit_articles", async () => {
    const article = await createArticleRecord(db(), input);
    return { id: article.id };
  });
}

export async function updateArticle(id: number, input: ArticleInput) {
  return runAction("edit_articles", async () => {
    await updateArticleRecord(db(), articleId.parse(id), input);
  });
}

export async function deleteArticle(id: number) {
  return runAction("edit_articles", () => deleteArticleRecord(db(), articleId.parse(id)));
}

// Превью загружает редактор статей, поэтому нужно право на статьи, а не на медиатеку.
export async function uploadArticlePreview(formData: FormData) {
  return runAction("edit_articles", async (user) => {
    const image = await saveUploadedImage(db(), formData.get("file"), user.id);
    return { id: image.id, url: mediaUrl(image.storageKey) };
  });
}
