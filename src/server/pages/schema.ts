import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable()
    .default(null);

export const pageInputSchema = z.object({
  parentId: z.number().int().positive().nullable(),
  slug: z.string().regex(SLUG_PATTERN, "Только латиница в нижнем регистре, цифры и дефисы"),
  title: z.string().trim().min(1, "Укажите заголовок").max(200),
  menuTitle: optionalText(100),
  metaDescription: optionalText(300),
  content: z
    .object({ type: z.literal("doc"), content: z.array(z.unknown()).optional() })
    .nullable()
    .default(null),
  template: z.string().min(1).default("default"),
  published: z.boolean().default(false),
  isHome: z.boolean().default(false),
});

export type PageInput = z.input<typeof pageInputSchema>;
