import { describe, expect, it } from "vitest";
import { classifySitePath } from "./site-routes";

describe("classifySitePath", () => {
  it.each([
    ["/", { kind: "other" }],
    ["/about", { kind: "page", path: "about" }],
    ["/about/team", { kind: "page", path: "about/team" }],
    ["/articles", { kind: "articleList" }],
    ["/articles/first-news", { kind: "article", slug: "first-news" }],
    ["/search", { kind: "other" }],
    ["/login", { kind: "other" }],
    ["/articles/a/b", { kind: "invalid" }],
    ["/articles/Bad", { kind: "invalid" }],
    ["/About", { kind: "invalid" }],
    ["/about/", { kind: "invalid" }],
    ["/a%20b", { kind: "invalid" }],
    ["/package.json", { kind: "invalid" }],
    [`/${Array(21).fill("a").join("/")}`, { kind: "invalid" }],
  ])("%s", (pathname, expected) => {
    expect(classifySitePath(pathname)).toEqual(expected);
  });
});
