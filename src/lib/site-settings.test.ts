import { describe, expect, it } from "vitest";
import { normalizePhone, phoneHref, readSiteSettings, siteSettingsSchema } from "./site-settings";

describe("настройки сайта", () => {
  it("без записи все настройки пустые", () => {
    expect(readSiteSettings(undefined)).toEqual({
      logo: null,
      phone: "",
      email: "",
      address: "",
      hours: "",
      socials: [],
    });
  });

  it("негодное значение из БД заменяется пустым, остальные остаются", () => {
    expect(
      readSiteSettings({
        phone: "+7 999 123-45-67",
        email: "не почта",
        socials: [{ network: "vk", url: "javascript:alert(1)" }],
        removed: "поле убрали из темы",
      }),
    ).toEqual({
      logo: null,
      phone: "+7 999 123-45-67",
      email: "",
      address: "",
      hours: "",
      socials: [],
    });
  });

  it("неизвестная соцсеть — «Другое», адрес обязателен", () => {
    const parsed = siteSettingsSchema.parse({
      socials: [{ network: "myspace", url: "https://myspace.com/me" }],
    });
    expect(parsed.socials).toEqual([{ network: "other", url: "https://myspace.com/me" }]);
    expect(siteSettingsSchema.safeParse({ socials: [{ network: "vk" }] }).success).toBe(false);
  });

  it("ссылка на телефон — только цифры и «+»", () => {
    expect(normalizePhone(" +7 (999) 123-45-67")).toBe("+79991234567");
    expect(phoneHref("8 800 555-35-35")).toBe("tel:88005553535");
  });
});
