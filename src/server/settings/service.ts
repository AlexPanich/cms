import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import type { Executor, Tx } from "@/db";
import { media, settingsMedia, siteSettings } from "@/db/schema";
import { fieldReferences, walkFields } from "@/lib/blocks/define";
import {
  readSiteSettings,
  SITE_SETTINGS,
  type SiteSettings,
  siteSettingsSchema,
} from "@/lib/site-settings";
import { type SiteSettingsInput, siteSettingsInputSchema } from "./schema";

const SETTINGS_ID = 1;

// Записи может ещё не быть: тогда все настройки пустые.
export async function getSiteSettings(executor: Executor): Promise<SiteSettings> {
  const [row] = await executor
    .select({ data: siteSettings.data })
    .from(siteSettings)
    .where(eq(siteSettings.id, SETTINGS_ID));
  return readSiteSettings(row?.data);
}

// Ссылки из настроек на картинки, галереи и страницы — чтобы загрузить их до вывода.
export function settingsReferences(settings: SiteSettings) {
  return fieldReferences(walkFields(SITE_SETTINGS, settings));
}

// Картинки из настроек — в settings_media для подсчёта использования. Удалённую из
// медиатеки картинку настройки не держат: на сайте её просто не будет.
async function syncSettingsMedia(tx: Tx, settings: SiteSettings) {
  await tx.delete(settingsMedia);
  const ids = settingsReferences(settings).imageIds;
  if (ids.length === 0) return;
  await tx.insert(settingsMedia).select(
    tx
      .select({ mediaId: media.id })
      .from(media)
      .where(and(inArray(media.id, ids), eq(media.kind, "image"))),
  );
}

// Меняет переданные настройки, остальные оставляет. Сохранённое значение, которое больше
// не проходит схему, заменяется пустым, чтобы не мешать сохранить остальное.
export async function updateSiteSettings(
  executor: Executor,
  input: SiteSettingsInput,
): Promise<SiteSettings> {
  const patch = siteSettingsInputSchema.parse(input);
  return executor.transaction(async (tx) => {
    // Запись создаётся при первом сохранении; блокировка — чтобы две правки разных полей
    // не затёрли друг друга.
    await tx.insert(siteSettings).values({ id: SETTINGS_ID }).onConflictDoNothing();
    const [row] = await tx
      .select({ data: siteSettings.data })
      .from(siteSettings)
      .where(eq(siteSettings.id, SETTINGS_ID))
      .for("update");
    const settings = siteSettingsSchema.parse({ ...readSiteSettings(row.data), ...patch });
    await tx.update(siteSettings).set({ data: settings }).where(eq(siteSettings.id, SETTINGS_ID));
    await syncSettingsMedia(tx, settings);
    return settings;
  });
}
