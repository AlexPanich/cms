import type { RichTextDoc } from "@/lib/rich-text";
import { emptyFieldValue, type Fields, fieldsSchema } from "./define";

// Данные для примеров блоков (defineBlock({ example })). Примеры ссылаются на эти id и ключи,
// а каталог /_blocks подставляет вместо них картинки-заглушки, галерею, документы и страницу —
// без записей в БД. Файл без серверных зависимостей: его импортируют описания блоков.

// Картинки-заглушки: разные цвета, чтобы на примере было видно, какая где.
export const EXAMPLE_IMAGES = [1, 2, 3, 4, 5, 6] as const;
export const EXAMPLE_GALLERY = "example";
export const EXAMPLE_DOCUMENTS = [1, 2, 3] as const;
// Страница сайта для ссылок «на страницу».
export const EXAMPLE_PAGE = 1;

export const exampleImage = (index = 0, alt = "") => ({
  mediaId: EXAMPLE_IMAGES[index % EXAMPLE_IMAGES.length],
  alt,
});

// Документ rich text из абзацев; строка, начинающаяся с «## », — подзаголовок.
export function exampleDoc(...blocks: string[]): RichTextDoc {
  return {
    type: "doc",
    content: blocks.map((text) =>
      text.startsWith("## ")
        ? {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: text.slice(3) }],
          }
        : { type: "paragraph", content: [{ type: "text", text }] },
    ),
  };
}

function minimalValues(fields: Fields, data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([name, item]): [string, unknown] => {
      const value = data[name];
      switch (item.kind) {
        case "list":
          return [
            name,
            (value as Record<string, unknown>[])
              .slice(0, item.min)
              .map((element) => minimalValues(item.of, element)),
          ];
        case "select":
        case "boolean":
          return [name, item.default];
        default:
          return [name, item.required ? value : emptyFieldValue(item)];
      }
    }),
  );
}

// Пустое состояние блока: заполнены только обязательные поля, в списках — минимум элементов,
// select и boolean — по умолчанию. Так дизайнер видит, как блок выглядит без необязательного.
// data — уже прошедший схему пример.
export function minimalExample(
  fields: Fields,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return fieldsSchema(fields).parse(minimalValues(fields, data));
}
