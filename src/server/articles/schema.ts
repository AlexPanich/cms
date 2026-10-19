import { z } from "zod";
import { richTextDocSchema } from "@/lib/rich-text";
import { SLUG_PATTERN } from "@/lib/slug";
import { optionalText } from "@/lib/zod";

export const articleInputSchema = z.object({
  slug: z.string().regex(SLUG_PATTERN, "Только латиница в нижнем регистре, цифры и дефисы"),
  title: z.string().trim().min(1, "Укажите заголовок").max(200),
  excerpt: optionalText(500),
  content: richTextDocSchema.nullable().default(null),
  previewId: z.number().int().positive().nullable().default(null),
  published: z.boolean().default(false),
});

export type ArticleInput = z.input<typeof articleInputSchema>;
