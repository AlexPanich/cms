import { describe, expect, it } from "vitest";
import { CORE_SETTINGS } from "@/lib/site-settings";
import { BLOCK_VARIANTS } from "@/theme/blocks";
import { THEME_SETTINGS } from "@/theme/settings";
import { catalogEntries, unresolvedExampleReferences } from "@/server/site/catalog";
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

describe("примеры блоков для каталога", () => {
  it.each(BLOCKS.map((block) => [block.type, block] as const))(
    "%s: пример проходит схему и ссылается только на данные каталога",
    (_, block) => {
      const parsed = block.schema.safeParse(block.example);
      expect(parsed.error?.issues ?? []).toEqual([]);
      expect(unresolvedExampleReferences(block.fields, parsed.data ?? {})).toEqual([]);
    },
  );

  it("в каталоге каждый блок, вариант и пустое состояние проходят схему", () => {
    const entries = catalogEntries();
    expect(entries.map((entry) => entry.type)).toEqual(BLOCKS.map((block) => block.type));
    for (const entry of entries) {
      const definition = getBlockDefinition(entry.type)!;
      for (const { block } of entry.examples) {
        expect(definition.schema.safeParse(block.data).success, `${entry.type}/${block.id}`).toBe(
          true,
        );
      }
    }
  });
});

describe("настройки темы", () => {
  it("не совпадают по имени с настройками ядра", () => {
    const core = new Set(Object.keys(CORE_SETTINGS));
    expect(Object.keys(THEME_SETTINGS).filter((name) => core.has(name))).toEqual([]);
  });
});
