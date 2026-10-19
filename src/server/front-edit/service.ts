import "server-only";
import { and, eq } from "drizzle-orm";
import type { Executor } from "@/db";
import { pages, texts } from "@/db/schema";
import { DomainError } from "@/server/errors";
import { PageError, updatePageBlock } from "@/server/pages/service";
import { type FrontEditInput, frontEditInputSchema } from "./schema";

export type FrontEditErrorCode = "page_not_found" | "text_not_found";

export class FrontEditError extends DomainError<FrontEditErrorCode> {}

const pageNotFound = () =>
  new FrontEditError("page_not_found", "Страница не найдена или снята с публикации");

// Правка поля из белого списка (schema.ts). Править можно только то, что видно на сайте:
// опубликованную страницу и показываемый текст. Черновики — только из админки.
export async function saveFrontEdit(executor: Executor, input: FrontEditInput): Promise<void> {
  const data = frontEditInputSchema.parse(input);

  if (data.field === "text.body") {
    const updated = await executor
      .update(texts)
      .set({ body: data.value })
      .where(and(eq(texts.key, data.key), eq(texts.published, true)))
      .returning({ id: texts.id });
    if (updated.length === 0) {
      throw new FrontEditError("text_not_found", "Текст не найден или скрыт на сайте");
    }
    return;
  }

  if (data.field === "page.block") {
    try {
      await updatePageBlock(executor, data.pageId, data.blockId, data.data, {
        publishedOnly: true,
      });
    } catch (error) {
      if (error instanceof PageError && error.code === "page_not_found") throw pageNotFound();
      throw error;
    }
    return;
  }

  const updated = await executor
    .update(pages)
    .set({ title: data.value })
    .where(and(eq(pages.id, data.pageId), eq(pages.published, true)))
    .returning({ id: pages.id });
  if (updated.length === 0) throw pageNotFound();
}
