import { z } from "zod";
import { SLUG_PATTERN } from "./slug";

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

// Узел-виджет «галерея»: { type: "gallery", attrs: { key } }. Галерея ищется по ключу
// при выводе на сайте; если её удалили, узел ничего не выводит.
export const GALLERY_NODE = "gallery";

export function galleryKeyOf(node: RichTextNode): string | null {
  const key = node.attrs?.key;
  return typeof key === "string" && SLUG_PATTERN.test(key) ? key : null;
}

// Ключи всех галерей документа — чтобы загрузить их одним запросом до вывода.
export function collectGalleryKeys(doc: RichTextDoc | null): string[] {
  const keys = new Set<string>();
  const visit = (nodes: RichTextNode[] | undefined) => {
    for (const node of nodes ?? []) {
      if (node.type === GALLERY_NODE) {
        const key = galleryKeyOf(node);
        if (key) keys.add(key);
      }
      visit(node.content);
    }
  };
  visit(doc?.content);
  return [...keys];
}
