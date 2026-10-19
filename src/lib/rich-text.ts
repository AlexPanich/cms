import { z } from "zod";

// Ограничение на размер документа TipTap в JSON — защита от случайно вставленных мегабайтов.
const MAX_DOC_LENGTH = 500_000;

const attrsSchema = z.record(z.string(), z.unknown());

const markSchema = z.object({
  type: z.string(),
  attrs: attrsSchema.optional(),
});

// Узел документа TipTap (ProseMirror JSON). Лишние поля отбрасываются.
const nodeSchema = z.object({
  type: z.string(),
  attrs: attrsSchema.optional(),
  get content() {
    return z.array(nodeSchema).optional();
  },
  marks: z.array(markSchema).optional(),
  text: z.string().optional(),
});

export const richTextDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(nodeSchema).optional(),
  })
  .refine((doc) => JSON.stringify(doc).length <= MAX_DOC_LENGTH, "Слишком большой текст");

export type RichTextNode = z.infer<typeof nodeSchema>;
export type RichTextDoc = z.infer<typeof richTextDocSchema>;
