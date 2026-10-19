import { richTextDocSchema } from "@/lib/rich-text";
import { SLUG_PATTERN } from "@/lib/slug";
import { z } from "@/lib/zod";
import { pageInputSchema } from "@/server/pages/schema";
import { textInputSchema } from "@/server/texts/schema";

// Значения полей — по тем же правилам, что в формах админки.
export const pageTitleSchema = pageInputSchema.shape.title;
export const pageContentSchema = richTextDocSchema.nullable();
export const textBodySchema = textInputSchema.shape.body;

const pageId = z.number().int().positive();

// Белый список полей, которые правятся прямо на сайте. Другие поля (адрес, публикация,
// шаблон…) так поменять нельзя: в схеме их нет.
export const frontEditInputSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("page.title"), pageId, value: pageTitleSchema }),
  z.object({ field: z.literal("page.content"), pageId, value: pageContentSchema }),
  z.object({
    field: z.literal("text.body"),
    key: z.string().regex(SLUG_PATTERN),
    value: textBodySchema,
  }),
]);

export type FrontEditInput = z.input<typeof frontEditInputSchema>;
