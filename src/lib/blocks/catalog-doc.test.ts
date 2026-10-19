import { describe, expect, it } from "vitest";
import { formatAspect, renderBlocksDoc } from "./catalog-doc";
import { BLOCKS } from "./registry";

describe("docs/BLOCKS.md", () => {
  it("пропорции дробью", () => {
    expect(formatAspect(16 / 9)).toBe("16:9");
    expect(formatAspect(4 / 3)).toBe("4:3");
    expect(formatAspect(1)).toBe("1:1");
    expect(formatAspect(Math.PI)).toBe("3.14");
  });

  it("описывает каждый блок, поля списков и настройки сайта", () => {
    const doc = renderBlocksDoc();
    for (const block of BLOCKS) expect(doc).toContain(`## ${block.label} (\`${block.type}\`)`);
    expect(doc).toContain(
      "| ↳ Заголовок (`items[].title`) | строка | да | до 80 символов; одной строкой |",
    );
    expect(doc).toContain("«Картинка справа» (`image-right`)");
    expect(doc).toContain(
      "| Телефон (`phone`) | строка | нет | до 30 символов; одной строкой; телефон |",
    );
  });
});
