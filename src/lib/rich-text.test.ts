import { describe, expect, it } from "vitest";
import { richTextDocSchema } from "./rich-text";

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
