import { describe, expect, it, vi } from "vitest";
import { field } from "./define";
import { blocksFormValue, fieldsFormData, hasFieldKind } from "./form";
import { blocksSchema } from "./registry";

vi.mock("@/theme/blocks", async () => {
  const { defineBlock, field } = await import("./define");
  return {
    THEME_BLOCKS: [
      defineBlock({
        type: "team",
        label: "Команда",
        description: "",
        example: {},
        fields: {
          title: field.text({ label: "Заголовок", required: true }),
          people: field.list(
            {
              name: field.text({ label: "Имя", required: true }),
              photo: field.image({ label: "Фото" }),
            },
            { label: "Люди", itemLabel: "Человек", max: 2 },
          ),
        },
      }),
    ],
    BLOCK_VARIANTS: { team: [{ key: "dark", label: "На тёмном фоне" }] },
  };
});

const doc = { type: "doc", content: [{ type: "paragraph" }] };

const fields = {
  title: field.text({ label: "Заголовок", required: true }),
  body: field.richText({ label: "Текст" }),
  image: field.image({ label: "Картинка" }),
  more: field.link({ label: "Ссылка" }),
  theme: field.select({
    label: "Тема",
    options: [
      { value: "light", label: "Светлая" },
      { value: "dark", label: "Тёмная" },
    ],
    default: "dark",
  }),
  wide: field.boolean({ label: "Во всю ширину", default: true }),
  items: field.list(
    { name: field.text({ label: "Имя" }) },
    { label: "Список", itemLabel: "Пункт", max: 5 },
  ),
};

describe("fieldsFormData", () => {
  it("новый блок — пустые значения и значения по умолчанию", () => {
    expect(fieldsFormData(fields)).toEqual({
      title: "",
      body: null,
      image: null,
      more: null,
      theme: "dark",
      wide: true,
      items: [],
    });
  });

  it("годные значения остаются, негодные заменяются пустыми", () => {
    expect(
      fieldsFormData(fields, {
        title: 42,
        body: doc,
        image: { mediaId: -1 },
        more: { kind: "url", url: "javascript:alert(1)" },
        theme: "light",
        wide: false,
        items: [{ name: "Аня" }, { name: 7 }],
      }),
    ).toEqual({
      title: "",
      body: doc,
      image: null,
      more: null,
      theme: "light",
      wide: false,
      items: [{ name: "Аня" }, { name: "" }],
    });
    expect(fieldsFormData(fields, "не объект")).toEqual(fieldsFormData(fields));
  });
});

describe("blocksFormValue", () => {
  it("читает блоки из БД для формы", () => {
    const raw = [
      { id: "a", type: "text", data: { content: doc } },
      { id: "b", type: "team", variant: "gone", data: { people: [{ name: "Аня" }] } },
      { id: "c", type: "removed", variant: "x", data: { any: 1 } },
    ];
    expect(blocksFormValue(raw)).toEqual([
      { id: "a", type: "text", variant: null, data: { content: doc } },
      {
        id: "b",
        type: "team",
        variant: null,
        data: { title: "", people: [{ name: "Аня", photo: null }] },
      },
      { id: "c", type: "removed", variant: "x", data: { any: 1 } },
    ]);
  });

  it("лишние элементы списка отбрасываются, битые и повторные id заменяются", () => {
    const [first, second, third] = blocksFormValue([
      { id: "a", type: "team", data: { title: "Мы", people: [{}, {}, {}] } },
      { id: "a", type: "text", data: {} },
      { type: "text" },
    ]);
    expect(first.data).toEqual({
      title: "Мы",
      people: [
        { name: "", photo: null },
        { name: "", photo: null },
      ],
    });
    expect(second.id).not.toBe("a");
    expect(third.id).toMatch(/^[\w-]+$/);
    expect(blocksFormValue(null)).toEqual([]);
  });

  it("после правки формы блоки проходят схему, а нерабочие — нет", () => {
    const blocks = blocksFormValue([{ id: "a", type: "team", data: {} }]);
    expect(blocksSchema.safeParse(blocks).success).toBe(false);
    const fixed = blocks.map((block) => ({ ...block, data: { title: "Мы", people: [] } }));
    expect(blocksSchema.safeParse(fixed).success).toBe(true);
  });
});

describe("hasFieldKind", () => {
  it("ищет поле и внутри списков", () => {
    const list = {
      items: field.list(
        { more: field.link({ label: "Ссылка" }) },
        { label: "Список", itemLabel: "Пункт", max: 3 },
      ),
    };
    expect(hasFieldKind(list, "link")).toBe(true);
    expect(hasFieldKind(list, "richText")).toBe(false);
    expect(hasFieldKind(fields, "richText")).toBe(true);
  });
});
