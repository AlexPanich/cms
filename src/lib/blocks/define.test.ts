import { describe, expect, expectTypeOf, it } from "vitest";
import type { RichTextDoc } from "@/lib/rich-text";
import type { z } from "@/lib/zod";
import { type FieldsData, defineBlock, field, walkFields } from "./define";

const doc = { type: "doc" as const, content: [{ type: "paragraph" }] };

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message);

describe("field.text", () => {
  it("обрезает пробелы, по умолчанию пустая строка", () => {
    const { schema } = field.text({ label: "Заголовок" });
    expect(schema.parse("  Привет ")).toBe("Привет");
    expect(schema.parse(undefined)).toBe("");
  });

  it("проверяет длину, обязательность и переносы строк", () => {
    const title = field.text({ label: "Заголовок", required: true, max: 5 });
    expect(messages(title.schema.safeParse("   "))).toEqual(["Обязательное поле"]);
    expect(messages(title.schema.safeParse(undefined))).toEqual(["Обязательное поле"]);
    expect(messages(title.schema.safeParse("шесть!"))).toEqual(["Не длиннее 5 символов"]);
    expect(messages(title.schema.safeParse("a\nb"))).toEqual(["Без переносов строк"]);
    const text = field.text({ label: "Текст", multiline: true });
    expect(text.schema.parse("a\nb")).toBe("a\nb");
  });
});

describe("необязательные поля", () => {
  it("пустое значение — null, обязательное не пропускает null", () => {
    expect(field.richText({ label: "Текст" }).schema.parse(undefined)).toBeNull();
    expect(field.richText({ label: "Текст" }).schema.parse(doc)).toEqual(doc);
    const required = field.richText({ label: "Текст", required: true });
    expect(messages(required.schema.safeParse(null))).toEqual(["Обязательное поле"]);
  });

  it("картинка — id из медиатеки и alt", () => {
    const { schema } = field.image({ label: "Картинка", aspect: 16 / 9 });
    expect(schema.parse({ mediaId: 3 })).toEqual({ mediaId: 3, alt: "" });
    expect(schema.safeParse({ mediaId: 0 }).success).toBe(false);
    expect(schema.parse(null)).toBeNull();
  });

  it("ссылка — на страницу по id или безопасный адрес", () => {
    const { schema } = field.link({ label: "Кнопка", required: true });
    expect(schema.parse({ kind: "page", pageId: 5 })).toEqual({
      kind: "page",
      pageId: 5,
      label: "",
    });
    expect(schema.parse({ kind: "url", url: "/about", label: " Подробнее " })).toEqual({
      kind: "url",
      url: "/about",
      label: "Подробнее",
    });
    expect(schema.safeParse({ kind: "url", url: "javascript:alert(1)" }).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });
});

describe("field.list", () => {
  const cards = field.list(
    { title: field.text({ label: "Заголовок", required: true }) },
    { label: "Карточки", itemLabel: "Карточка", min: 1, max: 2 },
  );

  it("проверяет элементы и их число", () => {
    expect(cards.schema.parse([{ title: " A ", extra: 1 }])).toEqual([{ title: "A" }]);
    expect(messages(cards.schema.safeParse([]))).toEqual(["Не меньше 1 элемента"]);
    expect(messages(cards.schema.safeParse(undefined))).toEqual(["Не меньше 1 элемента"]);
    expect(cards.schema.safeParse([{ title: "" }]).error?.issues[0]?.path).toEqual([0, "title"]);
    expect(cards.schema.safeParse([{ title: "a" }, { title: "b" }, { title: "c" }]).success).toBe(
      false,
    );
  });

  it("без min по умолчанию пустой", () => {
    const list = field.list(
      { q: field.text({ label: "Вопрос" }) },
      { label: "", itemLabel: "", max: 3 },
    );
    expect(list.schema.parse(undefined)).toEqual([]);
  });
});

describe("field.select и field.boolean", () => {
  it("неизвестное значение select заменяется значением по умолчанию", () => {
    const { schema } = field.select({
      label: "Выравнивание",
      options: [
        { value: "left", label: "Слева" },
        { value: "center", label: "По центру" },
      ],
      default: "center",
    });
    expect(schema.parse("left")).toBe("left");
    expect(schema.parse("right")).toBe("center");
    expect(schema.parse(undefined)).toBe("center");
  });

  it("boolean по умолчанию false", () => {
    expect(field.boolean({ label: "Тёмный фон" }).schema.parse(undefined)).toBe(false);
    expect(field.boolean({ label: "Тёмный фон", default: true }).schema.parse(undefined)).toBe(
      true,
    );
  });
});

describe("defineBlock", () => {
  it("собирает схему данных из полей и отбрасывает лишние", () => {
    const block = defineBlock({
      type: "media-text",
      label: "Картинка и текст",
      description: "",
      fields: {
        title: field.text({ label: "Заголовок", required: true }),
        image: field.image({ label: "Картинка" }),
      },
    });
    expect(block.schema.parse({ title: "Мы", old: "x" })).toEqual({ title: "Мы", image: null });
    expect(block.schema.safeParse({}).error?.issues[0]?.path).toEqual(["title"]);
  });

  it("выводит тип данных из полей", () => {
    const block = defineBlock({
      type: "typed",
      label: "",
      description: "",
      fields: {
        title: field.text({ label: "" }),
        body: field.richText({ label: "", required: true }),
        image: field.image({ label: "" }),
        align: field.select({
          label: "",
          options: [
            { value: "left", label: "" },
            { value: "right", label: "" },
          ],
        }),
        links: field.list(
          { link: field.link({ label: "", required: true }) },
          { label: "", itemLabel: "", max: 2 },
        ),
      },
    });
    expectTypeOf(block.schema).toEqualTypeOf<z.ZodType<FieldsData<typeof block.fields>>>();
    type Data = FieldsData<typeof block.fields>;
    expectTypeOf<Data["title"]>().toEqualTypeOf<string>();
    // Обязательное поле без null: контекст defineBlock не должен расширять required до boolean.
    expectTypeOf<Data["body"]>().toEqualTypeOf<RichTextDoc>();
    expectTypeOf<Data["image"]>().toEqualTypeOf<{ mediaId: number; alt: string } | null>();
    expectTypeOf<Data["align"]>().toEqualTypeOf<"left" | "right">();
    expectTypeOf<Data["links"][number]["link"]["kind"]>().toEqualTypeOf<"page" | "url">();
  });

  it("отклоняет недопустимый тип", () => {
    expect(() =>
      defineBlock({ type: "Media_Text", label: "", description: "", fields: {} }),
    ).toThrow();
  });
});

describe("walkFields", () => {
  it("обходит поля и элементы списков по порядку", () => {
    const fields = {
      title: field.text({ label: "Заголовок" }),
      items: field.list(
        { name: field.text({ label: "Имя" }), photo: field.image({ label: "Фото" }) },
        { label: "Люди", itemLabel: "Человек", max: 5 },
      ),
    };
    const entries = [
      ...walkFields(fields, {
        title: "Команда",
        items: [
          { name: "Аня", photo: { mediaId: 1, alt: "" } },
          { name: "Боря", photo: null },
        ],
      }),
    ];
    expect(entries.map((entry) => [entry.kind, entry.value])).toEqual([
      ["text", "Команда"],
      ["list", expect.any(Array)],
      ["text", "Аня"],
      ["image", { mediaId: 1, alt: "" }],
      ["text", "Боря"],
      ["image", null],
    ]);
  });
});
