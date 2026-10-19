import { z } from "zod";
import { PERMISSIONS } from "@/lib/permissions";
import { SLUG_PATTERN } from "@/lib/slug";

export const roleInputSchema = z.object({
  key: z
    .string()
    .trim()
    .max(50)
    .regex(SLUG_PATTERN, "Только латиница в нижнем регистре, цифры и дефисы"),
  name: z.string().trim().min(1, "Укажите название").max(100),
  permissions: z
    .array(z.enum(PERMISSIONS))
    .default([])
    .transform((list) => [...new Set(list)]),
});

export type RoleInput = z.input<typeof roleInputSchema>;
