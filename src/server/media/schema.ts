import { optionalText, z } from "@/lib/zod";

export const imageInfoSchema = z.object({
  alt: optionalText(300),
});

export type ImageInfoInput = z.input<typeof imageInfoSchema>;
