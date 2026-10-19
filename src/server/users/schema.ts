import { z } from "zod";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/password";

export const newUserSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Некорректный email")),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Пароль не короче ${MIN_PASSWORD_LENGTH} символов`)
    .max(MAX_PASSWORD_LENGTH),
  roleKeys: z.array(z.string().min(1)).default([]),
});

export type NewUserInput = z.input<typeof newUserSchema>;
