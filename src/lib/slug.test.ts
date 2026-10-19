import { describe, expect, it } from "vitest";
import { SLUG_PATTERN, slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["О компании", "o-kompanii"],
    ["Ёлки и щётки", "elki-i-schetki"],
    ["Подъезд №5", "podezd-no5"],
    ["  Hello,   World!  ", "hello-world"],
    ["Café déjà vu", "cafe-deja-vu"],
    ["---", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("результат проходит SLUG_PATTERN", () => {
    expect(slugify("Наши услуги 2026")).toMatch(SLUG_PATTERN);
  });
});

describe("SLUG_PATTERN", () => {
  it.each(["about", "about-us", "a1-b2"])("принимает %s", (slug) => {
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it.each(["", "About", "about--us", "-about", "about-", "about/us", "о-нас", "a_b"])(
    "отклоняет %s",
    (slug) => {
      expect(slug).not.toMatch(SLUG_PATTERN);
    },
  );
});
