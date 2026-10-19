import { describe, expect, it } from "vitest";
import { richTextDocSchema, richTextExcerpt } from "./rich-text";

describe("richTextDocSchema", () => {
  it("принимает документ TipTap и отбрасывает лишние поля", () => {
    const doc = richTextDocSchema.parse({
      type: "doc",
      content: [
        {
          type: "paragraph",
          extra: "мусор",
          content: [
            {
              type: "text",
              text: "Привет",
              marks: [{ type: "link", attrs: { href: "https://a.ru" } }],
            },
          ],
        },
      ],
    });
    expect(doc.content?.[0]).toEqual({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Привет",
          marks: [{ type: "link", attrs: { href: "https://a.ru" } }],
        },
      ],
    });
  });

  it("отклоняет не-документ и узлы без type", () => {
    expect(richTextDocSchema.safeParse({ type: "paragraph" }).success).toBe(false);
    expect(richTextDocSchema.safeParse({ type: "doc", content: [{ text: "x" }] }).success).toBe(
      false,
    );
  });

  it("ограничивает размер", () => {
    const huge = { type: "doc", content: [{ type: "text", text: "x".repeat(600_000) }] };
    expect(richTextDocSchema.safeParse(huge).success).toBe(false);
  });
});

describe("richTextExcerpt", () => {
  const doc = (...paragraphs: string[]) => ({
    type: "doc" as const,
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [
        { type: "text", text: text.slice(0, 3), marks: [{ type: "bold" }] },
        { type: "text", text: text.slice(3) },
      ],
    })),
  });

  it("склеивает абзацы через пробел, не разрывая слова с оформлением", () => {
    expect(richTextExcerpt(doc("Привет,  мир.", "Второй абзац"))).toBe("Привет, мир. Второй абзац");
  });

  it("обрезает по границе слова", () => {
    expect(richTextExcerpt(doc("Один два три четыре пять"), 15)).toBe("Один два три…");
  });

  it("пустой документ — null", () => {
    expect(richTextExcerpt(null)).toBeNull();
    expect(
      richTextExcerpt({ type: "doc", content: [{ type: "gallery", attrs: { key: "a" } }] }),
    ).toBeNull();
  });
});
