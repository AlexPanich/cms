import { asc } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import { pages } from "@/db/schema";
import { withRollback as withRollbackBase } from "@/test/db";
import type { PageInput } from "./schema";
import {
  createPage,
  deletePage,
  getPageTree,
  PageError,
  type PageErrorCode,
  reorderPages,
  updatePage,
} from "./service";

// Тесты сравнивают полный список страниц, поэтому начинают с пустой таблицы.
const withRollback = (fn: (tx: Tx) => Promise<void>) => withRollbackBase(fn, { clear: [pages] });

const input = (slug: string, parentId: number | null = null): PageInput => ({
  slug,
  parentId,
  title: slug,
});

async function expectPageError(promise: Promise<unknown>, code: PageErrorCode) {
  await expect(promise).rejects.toSatisfy(
    (error) => error instanceof PageError && error.code === code,
  );
}

async function paths(tx: Tx) {
  const rows = await tx.select({ path: pages.path }).from(pages).orderBy(asc(pages.path));
  return rows.map((r) => r.path);
}

describe("pages service", () => {
  it("вычисляет путь и порядок при создании", () =>
    withRollback(async (tx) => {
      const about = await createPage(tx, input("about"));
      const team = await createPage(tx, input("team", about.id));
      const jobs = await createPage(tx, input("jobs", about.id));

      expect(about.path).toBe("about");
      expect(team.path).toBe("about/team");
      expect([team.sort, jobs.sort]).toEqual([0, 1]);
    }));

  it("не даёт создать два одинаковых пути", () =>
    withRollback(async (tx) => {
      await createPage(tx, input("about"));
      await expectPageError(createPage(tx, input("about")), "path_taken");
    }));

  it("не даёт назначить вторую главную страницу", () =>
    withRollback(async (tx) => {
      await createPage(tx, { ...input("home"), isHome: true });
      await expectPageError(createPage(tx, { ...input("main"), isHome: true }), "home_taken");
    }));

  it("ругается на несуществующего родителя", () =>
    withRollback(async (tx) => {
      await expectPageError(createPage(tx, input("orphan", 999_999_999)), "parent_not_found");
    }));

  it("при смене slug пересчитывает пути всего поддерева, не задевая похожие", () =>
    withRollback(async (tx) => {
      const about = await createPage(tx, input("about"));
      const team = await createPage(tx, input("team", about.id));
      await createPage(tx, input("lead", team.id));
      await createPage(tx, input("about-us"));

      await updatePage(tx, about.id, input("company"));

      expect(await paths(tx)).toEqual(["about-us", "company", "company/team", "company/team/lead"]);
    }));

  it("при переносе меняет пути и ставит страницу в конец нового уровня", () =>
    withRollback(async (tx) => {
      const about = await createPage(tx, input("about"));
      const services = await createPage(tx, input("services"));
      await createPage(tx, input("design", services.id));
      const team = await createPage(tx, input("team", about.id));
      await createPage(tx, input("lead", team.id));

      const moved = await updatePage(tx, team.id, input("team", services.id));

      expect(moved.sort).toBe(1);
      expect(await paths(tx)).toEqual([
        "about",
        "services",
        "services/design",
        "services/team",
        "services/team/lead",
      ]);
    }));

  it("не даёт вложить страницу в саму себя или в потомка", () =>
    withRollback(async (tx) => {
      const about = await createPage(tx, input("about"));
      const team = await createPage(tx, input("team", about.id));

      await expectPageError(updatePage(tx, about.id, input("about", about.id)), "cycle");
      await expectPageError(updatePage(tx, about.id, input("about", team.id)), "cycle");
    }));

  it("не удаляет страницу с потомками", () =>
    withRollback(async (tx) => {
      const about = await createPage(tx, input("about"));
      const team = await createPage(tx, input("team", about.id));

      await expectPageError(deletePage(tx, about.id), "has_children");
      await deletePage(tx, team.id);
      await deletePage(tx, about.id);
      expect(await paths(tx)).toEqual([]);
    }));

  it("меняет порядок только при полном списке соседей", () =>
    withRollback(async (tx) => {
      const a = await createPage(tx, input("a"));
      const b = await createPage(tx, input("b"));
      const c = await createPage(tx, input("c"));

      await expectPageError(reorderPages(tx, null, [c.id, a.id]), "invalid_order");
      await expectPageError(reorderPages(tx, null, [c.id, a.id, a.id]), "invalid_order");

      await reorderPages(tx, null, [c.id, a.id, b.id]);
      const tree = await getPageTree(tx);
      expect(tree.map((n) => n.slug)).toEqual(["c", "a", "b"]);
    }));

  it("в дереве опубликованных скрывает неопубликованные ветки", () =>
    withRollback(async (tx) => {
      const about = await createPage(tx, { ...input("about"), published: true });
      const hidden = await createPage(tx, input("hidden", about.id));
      await createPage(tx, { ...input("inner", hidden.id), published: true });

      const tree = await getPageTree(tx, { publishedOnly: true });
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toEqual([]);
    }));
});
