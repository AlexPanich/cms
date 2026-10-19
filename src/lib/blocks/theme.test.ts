import { describe, expect, it } from "vitest";
import { BLOCK_VARIANTS } from "@/theme/blocks";
import { BLOCKS, getBlockDefinition } from "./registry";

// Контракт блоков темы: проверяется на настоящей теме, в том числе в репозитории клиента.
describe("блоки темы", () => {
  it("типы блоков не повторяются", () => {
    const types = BLOCKS.map((block) => block.type);
    expect(types).toEqual([...new Set(types)]);
  });

  it("варианты объявлены для существующих блоков, ключи не повторяются", () => {
    for (const [type, variants] of Object.entries(BLOCK_VARIANTS)) {
      expect(getBlockDefinition(type), `вариант для неизвестного блока ${type}`).toBeDefined();
      const keys = variants.map((variant) => variant.key);
      expect(keys).toEqual([...new Set(keys)]);
    }
  });
});
