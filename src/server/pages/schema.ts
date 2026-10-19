import { richTextDocSchema } from "@/lib/rich-text";
import { RESERVED_ROOT_SLUGS, SLUG_PATTERN } from "@/lib/slug";
import { PAGE_TEMPLATE_KEYS } from "@/lib/templates";
import { optionalText, z } from "@/lib/zod";

export const pageInputSchema = z
  .object({
    parentId: z.number().int().positive().nullable(),
    slug: z.string().regex(SLUG_PATTERN, "Только латиница в нижнем регистре, цифры и дефисы"),
    title: z.string().trim().min(1, "Укажите заголовок").max(200),
    menuTitle: optionalText(100),
    metaDescription: optionalText(300),
    content: richTextDocSchema.nullable().default(null),
    template: z.enum(PAGE_TEMPLATE_KEYS).default("default"),
    published: z.boolean().default(false),
    isHome: z.boolean().default(false),
  })
  .refine((page) => page.parentId !== null || !RESERVED_ROOT_SLUGS.includes(page.slug), {
    path: ["slug"],
    message: "Этот адрес занят разделом сайта, выберите другой",
  });

export type PageInput = z.input<typeof pageInputSchema>;
