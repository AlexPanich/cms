import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { collectGalleryKeys, type RichTextDoc, type RichTextNode } from "@/lib/rich-text";
import { type ContentContext, RichText } from "./rich-text";

const empty: ContentContext = { galleries: new Map() };

const render = (content: RichTextNode[], context = empty) =>
  renderToStaticMarkup(<RichText doc={{ type: "doc", content }} context={context} />);

const text = (value: string, marks?: RichTextNode["marks"]): RichTextNode => ({
  type: "text",
  text: value,
  marks,
});

describe("RichText", () => {
  it("выводит структуру и оформление документа", () => {
    expect(
      render([
        { type: "heading", attrs: { level: 1 }, content: [text("Заголовок")] },
        {
          type: "paragraph",
          content: [
            text("жирный", [{ type: "bold" }, { type: "italic" }]),
            { type: "hardBreak" },
            text("ссылка", [{ type: "link", attrs: { href: "/about" } }]),
          ],
        },
        {
          type: "orderedList",
          attrs: { start: 3 },
          content: [{ type: "listItem", content: [{ type: "paragraph", content: [text("п")] }] }],
        },
      ]),
    ).toBe(
      '<div class="prose prose-neutral dark:prose-invert max-w-none"><h2>Заголовок</h2>' +
        '<p><em><strong>жирный</strong></em><br/><a href="/about">ссылка</a></p>' +
        '<ol start="3"><li><p>п</p></li></ol></div>',
    );
  });

  it("экранирует текст и не выводит опасное", () => {
    const html = render([
      { type: "paragraph", content: [text("<script>alert(1)</script>")] },
      {
        type: "paragraph",
        content: [text("клик", [{ type: "link", attrs: { href: "javascript:alert(1)" } }])],
      },
      // Узлы не из реестра пропускаются вместе с содержимым.
      { type: "iframe", attrs: { src: "https://evil.test" }, content: [text("внутри")] },
      { type: "paragraph", attrs: { onclick: "alert(1)" }, content: [text("ок")] },
    ]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("<p>клик</p>");
    expect(html).not.toMatch(/iframe|evil|внутри|onclick/);
  });

  it("выводит галерею из контекста, пропускает неизвестную", () => {
    const content: RichTextNode[] = [
      { type: "gallery", attrs: { key: "office" } },
      { type: "gallery", attrs: { key: "missing" } },
      { type: "gallery", attrs: { key: "../bad key" } },
    ];
    const doc: RichTextDoc = { type: "doc", content };
    expect(collectGalleryKeys(doc)).toEqual(["office", "missing"]);

    const html = render(content, {
      galleries: new Map([
        [
          "office",
          {
            title: "Офис",
            images: [{ url: "/media/images/2026/01/a.webp", alt: "Вход", width: 10, height: 5 }],
          },
        ],
      ]),
    });
    expect(html).toContain(
      '<figcaption class="text-muted-foreground mt-2 text-sm">Офис</figcaption>',
    );
    expect(html).toContain('alt="Вход"');
    expect(html.match(/<figure/g)).toHaveLength(1);
  });
});
