import { siteSettingsSchema } from "@/lib/site-settings";
import { z } from "@/lib/zod";

// Полные настройки — схема форм в админке и на сайте (src/lib/site-settings.ts).
export { siteSettingsSchema };

// Ввод сервиса — часть настроек: правка на сайте меняет только свои поля, остальные
// остаются как есть. Значения проверяются схемой настроек после слияния с сохранёнными.
export const siteSettingsInputSchema = z.record(z.string(), z.unknown());

export type SiteSettingsInput = z.input<typeof siteSettingsInputSchema>;
