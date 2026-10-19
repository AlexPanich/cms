import { z } from "@/lib/zod";

export const documentInputSchema = z.object({
  title: z.string().trim().min(1, "Укажите название").max(200),
});

export type DocumentInput = z.input<typeof documentInputSchema>;
