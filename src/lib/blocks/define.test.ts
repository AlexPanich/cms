import { describe, expect, expectTypeOf, it } from "vitest";
import type { RichTextDoc } from "@/lib/rich-text";
import type { z } from "@/lib/zod";
import { type FieldsData, defineBlock, field, fieldReferences, walkFields } from "./define";

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

  it("проверяет формат, пустое необязательное значение допустимо", () => {
    const email = field.text({ label: "Почта", format: "email" });
    expect(email.schema.parse(" hi@example.com ")).toBe("hi@example.com");
    expect(email.schema.parse("")).toBe("");
    expect(email.schema.safeParse("hi@example").success).toBe(false);

    const phone = field.text({ label: "Телефон", format: "phone" });
    expect(phone.schema.parse("+7 (999) 123-45-67")).toBe("+7 (999) 123-45-67");
    expect(phone.schema.safeParse("12-34").success).toBe(false);
    expect(phone.schema.safeParse("звоните").success).toBe(false);

    const url = field.text({ label: "Адрес", format: "url", required: true });
    expect(url.schema.parse("https://vk.com/club")).toBe("https://vk.com/club");
    expect(messages(url.schema.safeParse(""))).toEqual(["Обязательное поле"]);
    for (const value of ["/about", "mailto:a@b.ru", "javascript:alert(1)", "vk.com"]) {
      expect(url.schema.safeParse(value).success, value).toBe(false);
    }
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

describe("field.gallery и field.document", () => {
  it("галерея — ключ, документ — id", () => {
    const gallery = field.gallery({ label: "Галерея", required: true });
    expect(gallery.schema.parse("office-2026")).toBe("office-2026");
    expect(gallery.schema.safeParse("Офис").success).toBe(false);
    expect(messages(gallery.schema.safeParse(undefined))).toEqual(["Обязательное поле"]);
    const document = field.document({ label: "Документ" });
    expect(document.schema.parse(undefined)).toBeNull();
    expect(document.schema.parse(5)).toBe(5);
    expect(document.schema.safeParse(0).success).toBe(false);
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
    type Data = FieldsData<typeof block.fields>;
    expectTypeOf(block.schema).toEqualTypeOf<z.ZodType<Data, Data>>();
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

describe("fieldReferences", () => {
  it("собирает картинки, документы, галереи и страницы без повторов", () => {
    const fields = {
      logo: field.image({ label: "Логотип" }),
      about: field.richText({ label: "О нас" }),
      items: field.list(
        {
          image: field.image({ label: "Картинка" }),
          file: field.document({ label: "Файл" }),
          photos: field.gallery({ label: "Фото" }),
          link: field.link({ label: "Ссылка" }),
        },
        { label: "Элементы", itemLabel: "Элемент", max: 5 },
      ),
    };
    const data = {
      logo: { mediaId: 1, alt: "" },
      about: { type: "doc", content: [{ type: "gallery", attrs: { key: "team" } }] },
      items: [
        {
          image: { mediaId: 1, alt: "" },
          file: 5,
          photos: "office",
          link: { kind: "page", pageId: 7, label: "" },
        },
        { image: { mediaId: 2, alt: "" }, file: null, photos: null, link: null },
      ],
    };
    expect(fieldReferences(walkFields(fields, data))).toEqual({
      imageIds: [1, 2],
      documentIds: [5],
      galleryKeys: ["team", "office"],
      pageIds: [7],
    });
  });
});
