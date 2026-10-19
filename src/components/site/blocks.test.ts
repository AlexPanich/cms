import { describe, expect, it } from "vitest";
import { resolveDocument, resolveImage, resolveLink } from "./blocks";
import type { ContentContext } from "./rich-text";
import { readSiteSettings } from "@/lib/site-settings";

const context: ContentContext = {
  galleries: new Map(),
  links: new Map([[7, { href: "/about", title: "О нас" }]]),
  images: new Map([[3, { url: "/media/images/a.webp", alt: "Кот", width: 40, height: 30 }]]),
  documents: new Map([
    [5, { url: "/media/documents/b.pdf", title: "Прайс", size: 100, extension: "pdf" }],
  ]),
  articles: [],
  settings: readSiteSettings({}),
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

describe("resolveImage и resolveDocument", () => {
  it("свой alt и название важнее данных из медиатеки, пустые — из неё", () => {
    expect(resolveImage({ mediaId: 3, alt: "" }, context)?.alt).toBe("Кот");
    expect(resolveImage({ mediaId: 3, alt: "Рыжий кот" }, context)).toEqual({
      url: "/media/images/a.webp",
      alt: "Рыжий кот",
      width: 40,
      height: 30,
    });
    expect(resolveDocument(5, "", context)?.title).toBe("Прайс");
    expect(resolveDocument(5, "Цены", context)?.title).toBe("Цены");
  });

  it("удалённые картинка и документ не выводятся", () => {
    expect(resolveImage({ mediaId: 4, alt: "" }, context)).toBeNull();
    expect(resolveImage(null, context)).toBeNull();
    expect(resolveDocument(6, "", context)).toBeNull();
    expect(resolveDocument(null, "", context)).toBeNull();
  });
});
