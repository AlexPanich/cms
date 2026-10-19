import type { z } from "@/lib/zod";
import { newUserSchema } from "@/server/users/schema";

// Первый администратор: роль всегда admin, выбирать её нельзя.
export const setupInputSchema = newUserSchema.omit({ roleKeys: true });

export type SetupInput = z.input<typeof setupInputSchema>;
