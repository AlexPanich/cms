import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

export const textInputSchema = z.object({
  key: z
    .string()
    .trim()
    .max(50)
    .regex(SLUG_PATTERN, "Только латиница в нижнем регистре, цифры и дефисы"),
  title: z.string().trim().min(1, "Укажите название").max(200),
  body: z.string().trim().max(10_000).default(""),
  published: z.boolean().default(true),
});

export type TextInput = z.input<typeof textInputSchema>;
