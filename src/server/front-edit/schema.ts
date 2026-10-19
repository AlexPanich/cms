import { SLUG_PATTERN } from "@/lib/slug";
import { z } from "@/lib/zod";
import { pageInputSchema } from "@/server/pages/schema";
import { siteSettingsInputSchema } from "@/server/settings/schema";
import { textInputSchema } from "@/server/texts/schema";

// Значения полей — по тем же правилам, что в формах админки.
export const pageTitleSchema = pageInputSchema.shape.title;
export const textBodySchema = textInputSchema.shape.body;

const pageId = z.number().int().positive();

// Белый список полей, которые правятся прямо на сайте. Другие поля (адрес, публикация,
// шаблон…) так поменять нельзя: в схеме их нет.
export const frontEditInputSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("page.title"), pageId, value: pageTitleSchema }),
  // Данные блока проверяются схемой его типа (src/lib/blocks) уже в сервисе: тип блока
  // берётся из страницы, а не из запроса.
  z.object({
    field: z.literal("page.block"),
    pageId,
    blockId: z.string().min(1).max(64),
    data: z.unknown(),
  }),
  // Часть настроек сайта: значения проверяются схемой настроек в сервисе.
  z.object({ field: z.literal("settings"), data: siteSettingsInputSchema }),
  z.object({
    field: z.literal("text.body"),
    key: z.string().regex(SLUG_PATTERN),
    value: textBodySchema,
  }),
]);

export type FrontEditInput = z.input<typeof frontEditInputSchema>;
