import { describe, expect, it } from "vitest";
import { defineBlock, field } from "./define";
import { minimalExample } from "./examples";

describe("minimalExample", () => {
  it("оставляет обязательные поля и минимум элементов списка", () => {
    const block = defineBlock({
      type: "sample",
      label: "",
      description: "",
      fields: {
        title: field.text({ label: "", required: true }),
        intro: field.text({ label: "" }),
        image: field.image({ label: "" }),
        dark: field.boolean({ label: "", default: true }),
        size: field.select({
          label: "",
          options: [
            { value: "s", label: "" },
            { value: "l", label: "" },
          ],
        }),
        items: field.list(
          { name: field.text({ label: "", required: true }), note: field.text({ label: "" }) },
          { label: "", itemLabel: "", min: 1, max: 5 },
        ),
        extra: field.list(
          { name: field.text({ label: "" }) },
          { label: "", itemLabel: "", max: 5 },
        ),
      },
      example: {},
    });
    const data = block.schema.parse({
      title: "Заголовок",
      intro: "Вступление",
      image: { mediaId: 1, alt: "" },
      dark: false,
      size: "l",
      items: [
        { name: "Первый", note: "Заметка" },
        { name: "Второй", note: "" },
      ],
      extra: [{ name: "Ещё" }],
    });
    expect(minimalExample(block.fields, data)).toEqual({
      title: "Заголовок",
      intro: "",
      image: null,
      dark: true,
      size: "s",
      items: [{ name: "Первый", note: "" }],
      extra: [],
    });
  });
});
