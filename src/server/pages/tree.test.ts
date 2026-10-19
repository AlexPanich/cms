import { describe, expect, it } from "vitest";
import { buildTree, flattenTree, isSameOrDescendantPath, joinPath, subtreeIds } from "./tree";

describe("joinPath", () => {
  it("корневая страница — путь равен slug", () => {
    expect(joinPath(null, "about")).toBe("about");
  });

  it("дочерняя страница — путь родителя + slug", () => {
    expect(joinPath("about/company", "team")).toBe("about/company/team");
  });
});

describe("isSameOrDescendantPath", () => {
  it.each([
    ["about", "about", true],
    ["about/team", "about", true],
    ["about/team/lead", "about", true],
    ["about-us", "about", false],
    ["aboutteam", "about", false],
    ["about", "about/team", false],
  ])("%s внутри %s → %s", (path, ancestor, expected) => {
    expect(isSameOrDescendantPath(path, ancestor)).toBe(expected);
  });
});

describe("buildTree", () => {
  const row = (id: number, parentId: number | null, sort: number) => ({ id, parentId, sort });

  it("строит вложенность и сортирует по sort, затем по id", () => {
    const tree = buildTree([
      row(1, null, 1),
      row(2, null, 0),
      row(3, 1, 0),
      row(4, 1, 0),
      row(5, 3, 0),
    ]);

    expect(tree.map((n) => n.id)).toEqual([2, 1]);
    expect(tree[1].children.map((n) => n.id)).toEqual([3, 4]);
    expect(tree[1].children[0].children.map((n) => n.id)).toEqual([5]);
  });

  it("отбрасывает поддерево, если родителя нет среди строк", () => {
    const tree = buildTree([row(1, null, 0), row(3, 2, 0), row(4, 3, 0)]);
    expect(tree).toEqual([{ ...row(1, null, 0), children: [] }]);
  });

  it("не мутирует входные строки", () => {
    const rows = [row(1, null, 0)];
    buildTree(rows);
    expect(rows[0]).not.toHaveProperty("children");
  });
});

describe("flattenTree и subtreeIds", () => {
  const row = (id: number, parentId: number | null, sort: number) => ({ id, parentId, sort });
  const tree = buildTree([row(1, null, 0), row(2, 1, 0), row(3, 2, 0), row(4, null, 1)]);

  it("разворачивает дерево в порядке обхода с глубиной", () => {
    expect(flattenTree(tree).map((n) => [n.id, n.depth])).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 0],
    ]);
  });

  it("собирает id поддерева", () => {
    expect(subtreeIds(tree[0])).toEqual([1, 2, 3]);
    expect(subtreeIds(tree[1])).toEqual([4]);
  });
});
