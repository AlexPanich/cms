import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_TEMPLATE, PAGE_TEMPLATES, resolvePageTemplate } from "./templates";

describe("resolvePageTemplate", () => {
  it("оставляет шаблон темы", () => {
    for (const template of PAGE_TEMPLATES) {
      expect(resolvePageTemplate(template.key)).toBe(template.key);
    }
  });

  it("неизвестный шаблон заменяет стандартным", () => {
    expect(resolvePageTemplate("landing-from-old-theme")).toBe(DEFAULT_PAGE_TEMPLATE);
    expect(resolvePageTemplate("")).toBe(DEFAULT_PAGE_TEMPLATE);
  });
});
