import { z } from "@/lib/zod";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Пароль не короче ${MIN_PASSWORD_LENGTH} символов`)
  .max(MAX_PASSWORD_LENGTH);

export const userInputSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Некорректный email")),
  roleKeys: z
    .array(z.string().min(1))
    .default([])
    .transform((list) => [...new Set(list)]),
});

export const newUserSchema = userInputSchema.extend({ password });

export const passwordSchema = z.object({ password });

export type UserInput = z.input<typeof userInputSchema>;
export type NewUserInput = z.input<typeof newUserSchema>;
export type PasswordInput = z.input<typeof passwordSchema>;
