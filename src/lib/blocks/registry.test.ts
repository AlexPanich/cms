import { describe, expect, it, vi } from "vitest";
import {
  type Block,
  blocksSchema,
  blocksSearchText,
  collectBlockMediaIds,
  collectBlockPageIds,
  parseStoredBlocks,
  resolveBlockVariant,
} from "./registry";

// Тема с собственным блоком: проверяем, что реестр подхватывает блоки и варианты темы.
vi.mock("@/theme/blocks", async () => {
  const { defineBlock, field } = await import("./define");
  return {
    THEME_BLOCKS: [
      defineBlock({
        type: "team",
        label: "Команда",
        description: "",
        fields: {
          title: field.text({ label: "Заголовок", required: true }),
          about: field.richText({ label: "О команде" }),
          more: field.link({ label: "Ссылка" }),
          people: field.list(
            {
              name: field.text({ label: "Имя" }),
              photo: field.image({ label: "Фото", aspect: 1 }),
              page: field.link({ label: "Страница" }),
            },
            { label: "Люди", itemLabel: "Человек", max: 10 },
          ),
        },
      }),
    ],
    BLOCK_VARIANTS: { team: [{ key: "dark", label: "На тёмном фоне" }] },
  };
});

const paragraph = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const team = {
  id: "b2",
  type: "team",
  variant: "dark",
  data: {
    title: "Команда",
    about: paragraph("Мы делаем сайты"),
    more: { kind: "page", pageId: 7 },
    people: [
      { name: "Аня", photo: { mediaId: 3 }, page: { kind: "page", pageId: 8 } },
      { name: "Боря", photo: { mediaId: 3 }, page: { kind: "url", url: "https://b.ru" } },
      { name: "", photo: { mediaId: 4 }, page: { kind: "page", pageId: 7 } },
    ],
  },
};

describe("blocksSchema", () => {
  it("проверяет данные блока схемой его типа", () => {
    const [text, parsed] = blocksSchema.parse([
      { id: "b1", type: "text", data: { content: paragraph("Привет") } },
      team,
    ]);
    expect(text).toEqual({
      id: "b1",
      type: "text",
      variant: null,
      data: { content: paragraph("Привет") },
    });
    expect(parsed?.variant).toBe("dark");
    expect(parsed?.data).toMatchObject({
      people: [{ photo: { mediaId: 3, alt: "" } }, {}, {}],
    });
  });

  it("ошибка данных указывает на поле блока", () => {
    const result = blocksSchema.safeParse([{ id: "b1", type: "text", data: {} }]);
    expect(result.error?.issues).toMatchObject([
      { path: [0, "data", "content"], message: "Обязательное поле" },
    ]);
  });

  it("отклоняет неизвестный тип, плохой и повторный id", () => {
    expect(
      blocksSchema.safeParse([{ id: "b1", type: "slider", data: {} }]).error?.issues,
    ).toMatchObject([{ path: [0, "type"], message: "Неизвестный тип блока" }]);
    expect(blocksSchema.safeParse([{ ...team, id: "a b" }]).success).toBe(false);
    expect(blocksSchema.safeParse([team, team]).error?.issues).toMatchObject([
      { path: [1, "id"], message: "Повторяется id блока" },
    ]);
  });
});

describe("варианты", () => {
  it("неизвестный вариант — оформление по умолчанию", () => {
    expect(resolveBlockVariant("team", "dark")).toBe("dark");
    expect(resolveBlockVariant("team", "light")).toBeNull();
    expect(resolveBlockVariant("text", "dark")).toBeNull();
    expect(resolveBlockVariant("toString", "dark")).toBeNull();
  });
});

describe("parseStoredBlocks", () => {
  it("помечает неизвестные и не прошедшие схему блоки", () => {
    const stored = parseStoredBlocks([
      team,
      { id: "b3", type: "slider", data: {} },
      { id: "b4", type: "team", data: { title: "" } },
      null,
    ]);
    expect(stored.map((item) => (item.ok ? item.block.id : item.reason))).toEqual([
      "b2",
      "unknown_type",
      "invalid",
      "unknown_type",
    ]);
  });

  it("не массив — пустой список", () => {
    expect(parseStoredBlocks(null)).toEqual([]);
    expect(parseStoredBlocks({ type: "doc" })).toEqual([]);
  });
});

describe("данные из полей блоков", () => {
  const blocks: Block[] = blocksSchema.parse([
    { id: "b1", type: "text", data: { content: paragraph("Вступление") } },
    team,
  ]);

  it("текст для поиска — текстовые поля и rich text по порядку", () => {
    expect(blocksSearchText(blocks)).toBe("Вступление\nКоманда\nМы делаем сайты\nАня\nБоря");
  });

  it("id картинок и страниц без повторов", () => {
    expect(collectBlockMediaIds(blocks)).toEqual([3, 4]);
    expect(collectBlockPageIds(blocks)).toEqual([7, 8]);
  });
});
