import "server-only";
import { asc, count, eq, ilike, or } from "drizzle-orm";
import type { Executor } from "@/db";
import { isUniqueViolation } from "@/db/errors";
import { texts } from "@/db/schema";
import { likePattern, PAGE_SIZE } from "@/lib/pagination";
import { DomainError } from "@/server/errors";
import { type TextInput, textInputSchema } from "./schema";

export type Text = typeof texts.$inferSelect;

export type TextErrorCode = "text_not_found" | "key_taken";

export class TextError extends DomainError<TextErrorCode> {}

const notFound = () => new TextError("text_not_found", "Текст не найден");

function toTextError(error: unknown): unknown {
  return isUniqueViolation(error, "texts_key_unique")
    ? new TextError("key_taken", "Текст с таким ключом уже существует", "key")
    : error;
}

// Запись — в транзакции: внутри внешней транзакции это savepoint, и ошибка уникальности
// не обрывает внешнюю.
export async function createText(executor: Executor, input: TextInput): Promise<Text> {
  const data = textInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    try {
      const [text] = await tx.insert(texts).values(data).returning();
      return text;
    } catch (error) {
      throw toTextError(error);
    }
  });
}

export async function updateText(executor: Executor, id: number, input: TextInput): Promise<Text> {
  const data = textInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    try {
      const [text] = await tx.update(texts).set(data).where(eq(texts.id, id)).returning();
      if (!text) throw notFound();
      return text;
    } catch (error) {
      throw toTextError(error);
    }
  });
}

export async function deleteText(executor: Executor, id: number): Promise<void> {
  const deleted = await executor.delete(texts).where(eq(texts.id, id)).returning({ id: texts.id });
  if (deleted.length === 0) throw notFound();
}

export async function getText(executor: Executor, id: number): Promise<Text | null> {
  const [text] = await executor.select().from(texts).where(eq(texts.id, id));
  return text ?? null;
}

export async function listTexts(
  executor: Executor,
  { page, search }: { page: number; search: string },
) {
  const where = search
    ? or(
        ilike(texts.title, likePattern(search)),
        ilike(texts.key, likePattern(search)),
        ilike(texts.body, likePattern(search)),
      )
    : undefined;

  const [items, [{ total }]] = await Promise.all([
    executor
      .select({
        id: texts.id,
        key: texts.key,
        title: texts.title,
        body: texts.body,
        published: texts.published,
        updatedAt: texts.updatedAt,
      })
      .from(texts)
      .where(where)
      .orderBy(asc(texts.title), asc(texts.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    executor.select({ total: count() }).from(texts).where(where),
  ]);
  return { items, total };
}
