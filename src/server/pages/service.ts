import "server-only";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { DomainError } from "@/server/errors";
import type { Executor, Tx } from "@/db";
import { isForeignKeyViolation, isUniqueViolation } from "@/db/errors";
import { pages } from "@/db/schema";
import { type PageInput, pageInputSchema } from "./schema";
import { buildTree, isSameOrDescendantPath, joinPath } from "./tree";

export type Page = typeof pages.$inferSelect;

export type PageErrorCode =
  | "page_not_found"
  | "parent_not_found"
  | "cycle"
  | "path_taken"
  | "home_taken"
  | "has_children"
  | "invalid_order";

export class PageError extends DomainError<PageErrorCode> {}

function toPageError(error: unknown): unknown {
  if (isUniqueViolation(error, "pages_path_unique")) {
    return new PageError("path_taken", "Страница с таким адресом уже существует", "slug");
  }
  if (isUniqueViolation(error, "pages_single_home")) {
    return new PageError("home_taken", "Главная страница уже назначена");
  }
  return error;
}

const siblingsOf = (parentId: number | null) =>
  parentId === null ? isNull(pages.parentId) : eq(pages.parentId, parentId);

async function nextSort(tx: Tx, parentId: number | null): Promise<number> {
  const [row] = await tx
    .select({ value: sql`coalesce(max(${pages.sort}) + 1, 0)`.mapWith(Number) })
    .from(pages)
    .where(siblingsOf(parentId));
  return row.value;
}

// Блокируем родителя на чтение, чтобы его путь не поменялся до конца транзакции.
async function lockParent(tx: Tx, parentId: number) {
  const [parent] = await tx
    .select({ id: pages.id, path: pages.path })
    .from(pages)
    .where(eq(pages.id, parentId))
    .for("share");
  if (!parent) {
    throw new PageError("parent_not_found", "Родительская страница не найдена", "parentId");
  }
  return parent;
}

export async function createPage(executor: Executor, input: PageInput): Promise<Page> {
  const data = pageInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    const parentPath = data.parentId === null ? null : (await lockParent(tx, data.parentId)).path;
    const sort = await nextSort(tx, data.parentId);
    try {
      const [page] = await tx
        .insert(pages)
        .values({ ...data, path: joinPath(parentPath, data.slug), sort })
        .returning();
      return page;
    } catch (error) {
      throw toPageError(error);
    }
  });
}

// Смена slug или родителя пересчитывает path у всего поддерева в той же транзакции.
export async function updatePage(executor: Executor, id: number, input: PageInput): Promise<Page> {
  const data = pageInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    const [current] = await tx.select().from(pages).where(eq(pages.id, id)).for("update");
    if (!current) {
      throw new PageError("page_not_found", "Страница не найдена");
    }

    let parentPath: string | null = null;
    if (data.parentId !== null) {
      const parent = await lockParent(tx, data.parentId);
      if (isSameOrDescendantPath(parent.path, current.path)) {
        throw new PageError(
          "cycle",
          "Нельзя вложить страницу в саму себя или в её потомка",
          "parentId",
        );
      }
      parentPath = parent.path;
    }

    const path = joinPath(parentPath, data.slug);
    const sort =
      data.parentId === current.parentId ? current.sort : await nextSort(tx, data.parentId);

    try {
      const [page] = await tx
        .update(pages)
        .set({ ...data, path, sort })
        .where(eq(pages.id, id))
        .returning();

      if (path !== current.path) {
        await tx
          .update(pages)
          .set({
            path: sql`${path}::text || substr(${pages.path}, ${current.path.length + 1}::int)`,
          })
          .where(sql`starts_with(${pages.path}, ${`${current.path}/`}::text)`);
      }
      return page;
    } catch (error) {
      throw toPageError(error);
    }
  });
}

export async function deletePage(executor: Executor, id: number): Promise<void> {
  const hasChildren = () =>
    new PageError("has_children", "Сначала перенесите или удалите дочерние страницы");

  await executor.transaction(async (tx) => {
    const [child] = await tx
      .select({ id: pages.id })
      .from(pages)
      .where(eq(pages.parentId, id))
      .limit(1);
    if (child) throw hasChildren();

    try {
      const deleted = await tx.delete(pages).where(eq(pages.id, id)).returning({ id: pages.id });
      if (deleted.length === 0) {
        throw new PageError("page_not_found", "Страница не найдена");
      }
    } catch (error) {
      // Потомок мог появиться параллельно — тогда сработает внешний ключ parent_id.
      throw isForeignKeyViolation(error) ? hasChildren() : error;
    }
  });
}

// orderedIds — полный список дочерних страниц parentId в новом порядке.
export async function reorderPages(
  executor: Executor,
  parentId: number | null,
  orderedIds: readonly number[],
): Promise<void> {
  await executor.transaction(async (tx) => {
    const siblings = await tx
      .select({ id: pages.id })
      .from(pages)
      .where(siblingsOf(parentId))
      .for("update");

    const expected = new Set(siblings.map((s) => s.id));
    const isPermutation =
      orderedIds.length === expected.size &&
      new Set(orderedIds).size === orderedIds.length &&
      orderedIds.every((id) => expected.has(id));
    if (!isPermutation) {
      throw new PageError("invalid_order", "Список страниц устарел, обновите страницу");
    }

    for (const [index, pageId] of orderedIds.entries()) {
      await tx.update(pages).set({ sort: index }).where(eq(pages.id, pageId));
    }
  });
}

export async function getPage(executor: Executor, id: number): Promise<Page | null> {
  const [page] = await executor.select().from(pages).where(eq(pages.id, id));
  return page ?? null;
}

export async function getPageTree(executor: Executor, { publishedOnly = false } = {}) {
  const rows = await executor
    .select({
      id: pages.id,
      parentId: pages.parentId,
      slug: pages.slug,
      path: pages.path,
      title: pages.title,
      menuTitle: pages.menuTitle,
      template: pages.template,
      published: pages.published,
      isHome: pages.isHome,
      sort: pages.sort,
    })
    .from(pages)
    .where(publishedOnly ? eq(pages.published, true) : undefined)
    .orderBy(asc(pages.sort), asc(pages.id));
  return buildTree(rows);
}

export type PageTreeNode = Awaited<ReturnType<typeof getPageTree>>[number];
