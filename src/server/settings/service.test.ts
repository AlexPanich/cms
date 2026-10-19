import { describe, expect, it } from "vitest";
import type { Tx } from "@/db";
import { media, settingsMedia, siteSettings } from "@/db/schema";
import { z } from "@/lib/zod";
import { withRollback } from "@/test/db";
import { listImages } from "@/server/media/service";
import { getSiteSettings, updateSiteSettings } from "./service";

// Запись media без файла: для настроек и подсчёта использования файл не нужен.
async function insertImage(tx: Tx, name: string, kind: "image" | "document" = "image") {
  const [row] = await tx
    .insert(media)
    .values({
      kind,
      storageKey: `${kind}s/test/${crypto.randomUUID()}`,
      originalName: name,
      mimeType: kind === "image" ? "image/webp" : "application/pdf",
      size: 1,
    })
    .returning();
  return row;
}

const clear = [siteSettings, settingsMedia];

describe("настройки сайта", () => {
  it("без записи пустые, первое сохранение создаёт запись", () =>
    withRollback(
      async (tx) => {
        expect(await getSiteSettings(tx)).toMatchObject({ phone: "", logo: null, socials: [] });
        const saved = await updateSiteSettings(tx, {
          phone: " +7 999 123-45-67 ",
          socials: [{ network: "telegram", url: "https://t.me/shop" }],
        });
        expect(saved).toMatchObject({ phone: "+7 999 123-45-67", email: "" });
        expect(await getSiteSettings(tx)).toEqual(saved);
        expect(await tx.select().from(siteSettings)).toHaveLength(1);
      },
      { clear },
    ));

  it("меняет только переданные настройки, лишние поля отбрасывает", () =>
    withRollback(
      async (tx) => {
        await updateSiteSettings(tx, { phone: "+7 999 000-00-00", email: "a@example.com" });
        await updateSiteSettings(tx, { email: "b@example.com", unknown: "мусор" });
        const [row] = await tx.select().from(siteSettings);
        expect(row.data).toMatchObject({ phone: "+7 999 000-00-00", email: "b@example.com" });
        expect(row.data).not.toHaveProperty("unknown");
      },
      { clear },
    ));

  it("негодное сохранённое значение не мешает сохранить другие", () =>
    withRollback(
      async (tx) => {
        await tx.insert(siteSettings).values({ data: { email: "не почта", phone: "+7 999 12" } });
        await updateSiteSettings(tx, { address: "Москва" });
        expect(await getSiteSettings(tx)).toMatchObject({
          email: "",
          phone: "+7 999 12",
          address: "Москва",
        });
      },
      { clear },
    ));

  it("отклоняет неверные значения и не меняет сохранённое", () =>
    withRollback(
      async (tx) => {
        await updateSiteSettings(tx, { phone: "+7 999 000-00-00" });
        const invalid = [
          { phone: "звоните" },
          { email: "a@b" },
          { socials: [{ network: "vk", url: "javascript:alert(1)" }] },
          { logo: { mediaId: -1 } },
        ];
        for (const input of invalid) {
          await expect(updateSiteSettings(tx, input)).rejects.toBeInstanceOf(z.ZodError);
        }
        await expect(updateSiteSettings(tx, [] as never)).rejects.toBeInstanceOf(z.ZodError);
        expect(await getSiteSettings(tx)).toMatchObject({ phone: "+7 999 000-00-00" });
      },
      { clear },
    ));

  it("логотип считается использованной картинкой, документ — нет", () =>
    withRollback(
      async (tx) => {
        const logo = await insertImage(tx, "settings-logo.png");
        const document = await insertImage(tx, "settings-file.pdf", "document");
        const usage = async () =>
          (await listImages(tx, { page: 1, search: "settings-logo", unused: false })).items[0];

        await updateSiteSettings(tx, { logo: { mediaId: logo.id, alt: "" } });
        expect(await usage()).toMatchObject({ id: logo.id, settingsUses: 1 });
        expect(await tx.select().from(settingsMedia)).toEqual([{ mediaId: logo.id }]);

        await updateSiteSettings(tx, { logo: { mediaId: document.id, alt: "" } });
        expect(await tx.select().from(settingsMedia)).toEqual([]);

        await updateSiteSettings(tx, { logo: { mediaId: logo.id, alt: "" } });
        await updateSiteSettings(tx, { logo: null });
        expect(await usage()).toMatchObject({ id: logo.id, settingsUses: 0 });
      },
      { clear },
    ));
});
