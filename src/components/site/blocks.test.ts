import { describe, expect, it } from "vitest";
import { resolveLink } from "./blocks";
import type { ContentContext } from "./rich-text";

const context: ContentContext = {
  galleries: new Map(),
  links: new Map([[7, { href: "/about", title: "О нас" }]]),
};

describe("resolveLink", () => {
  it("ссылка на страницу — её адрес, подпись по умолчанию — название", () => {
    expect(resolveLink({ kind: "page", pageId: 7, label: "" }, context)).toEqual({
      href: "/about",
      label: "О нас",
    });
    expect(resolveLink({ kind: "page", pageId: 7, label: "Подробнее" }, context)).toEqual({
      href: "/about",
      label: "Подробнее",
    });
  });

  it("удалённая или скрытая страница и опасный адрес не выводятся", () => {
    expect(resolveLink({ kind: "page", pageId: 8, label: "Нет" }, context)).toBeNull();
    expect(
      resolveLink({ kind: "url", url: "javascript:alert(1)", label: "x" }, context),
    ).toBeNull();
    expect(resolveLink(null, context)).toBeNull();
  });

  it("внешняя ссылка без подписи — адрес", () => {
    expect(resolveLink({ kind: "url", url: "https://a.ru", label: "" }, context)).toEqual({
      href: "https://a.ru",
      label: "https://a.ru",
    });
  });
});
