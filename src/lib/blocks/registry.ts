import { collectGalleryKeys, richTextPlainText, textExcerpt } from "@/lib/rich-text";
import { z } from "@/lib/zod";
import { BLOCK_VARIANTS, THEME_BLOCKS } from "@/theme/blocks";
import { CORE_BLOCKS } from "./catalog";
import { type BlockDefinition, type BlockVariant, type FieldsData, walkFields } from "./define";

// Реестр блоков: базовый каталог ядра и блоки темы. Блок страницы хранится как
// { id, type, variant, data }, data проверяется схемой своего типа.

export const BLOCKS = [...CORE_BLOCKS, ...THEME_BLOCKS] as const;

type AnyBlockDefinition = (typeof BLOCKS)[number];

export type BlockType = AnyBlockDefinition["type"];

export type BlockData<T extends BlockType> =
  Extract<AnyBlockDefinition, { type: T }> extends BlockDefinition<T, infer F>
    ? FieldsData<F>
    : never;

export type Block<T extends BlockType = BlockType> = {
  [K in T]: { id: string; type: K; variant: string | null; data: BlockData<K> };
}[T];

const DEFINITIONS = new Map<string, BlockDefinition>(
  BLOCKS.map((definition) => [definition.type, definition as BlockDefinition]),
);

export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return DEFINITIONS.get(type);
}

export function blockVariants(type: string): readonly BlockVariant[] {
  return Object.hasOwn(BLOCK_VARIANTS, type) ? BLOCK_VARIANTS[type] : [];
}

// Вариант мог пропасть из темы — тогда оформление по умолчанию, как с шаблонами страниц.
export function resolveBlockVariant(type: string, variant: string | null | undefined) {
  return variant && blockVariants(type).some((item) => item.key === variant) ? variant : null;
}

export const MAX_BLOCKS = 100;

// id блока создаёт редактор; по нему правка на сайте находит блок на странице.
export const BLOCK_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const blockSchema = z
  .object({
    id: z.string().regex(BLOCK_ID_PATTERN, "Неверный id блока"),
    type: z.string(),
    variant: z.string().nullish(),
    data: z.unknown(),
  })
  .transform((block, ctx): Block => {
    const definition = getBlockDefinition(block.type);
    if (!definition) {
      ctx.addIssue({ code: "custom", path: ["type"], message: "Неизвестный тип блока" });
      return z.NEVER;
    }
    const data = definition.schema.safeParse(block.data ?? {});
    if (!data.success) {
      for (const issue of data.error.issues) {
        ctx.addIssue({ code: "custom", path: ["data", ...issue.path], message: issue.message });
      }
      return z.NEVER;
    }
    return {
      id: block.id,
      type: block.type as BlockType,
      variant: resolveBlockVariant(block.type, block.variant),
      data: data.data,
    } as Block;
  });

export const blocksSchema = z
  .array(blockSchema)
  .max(MAX_BLOCKS)
  .superRefine((blocks, ctx) => {
    const seen = new Set<string>();
    blocks.forEach((block, index) => {
      if (seen.has(block.id)) {
        ctx.addIssue({ code: "custom", path: [index, "id"], message: "Повторяется id блока" });
      }
      seen.add(block.id);
    });
  });

// Блок из БД. Неизвестный тип или данные не по схеме на сайте не выводятся, а в админке
// помечаются «нужно исправить».
export type StoredBlock =
  { ok: true; block: Block } | { ok: false; reason: "unknown_type" | "invalid"; raw: unknown };

export function parseStoredBlocks(raw: unknown): StoredBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item): StoredBlock => {
    const parsed = blockSchema.safeParse(item);
    if (parsed.success) return { ok: true, block: parsed.data };
    const type = (item as { type?: unknown } | null)?.type;
    const known = typeof type === "string" && DEFINITIONS.has(type);
    return { ok: false, reason: known ? "invalid" : "unknown_type", raw: item };
  });
}

// Только блоки, которые можно вывести на сайте.
export function validStoredBlocks(raw: unknown): Block[] {
  return parseStoredBlocks(raw).flatMap((item) => (item.ok ? [item.block] : []));
}

function* blockValues(blocks: readonly Block[]) {
  for (const block of blocks) {
    const definition = getBlockDefinition(block.type);
    if (definition) yield* walkFields(definition.fields, block.data as Record<string, unknown>);
  }
}

// Текст блоков для поиска: текстовые поля и rich text по порядку, через перевод строки.
export function blocksSearchText(blocks: readonly Block[]): string {
  const parts: string[] = [];
  for (const entry of blockValues(blocks)) {
    if (entry.kind === "text") parts.push(entry.value);
    if (entry.kind === "richText") parts.push(richTextPlainText(entry.value));
  }
  return parts.filter(Boolean).join("\n");
}

// Описание страницы по умолчанию — из первого непустого текстового поля блоков.
export function blocksExcerpt(blocks: readonly Block[], maxLength = 160): string | null {
  for (const entry of blockValues(blocks)) {
    const text =
      entry.kind === "text"
        ? entry.value.replace(/\s+/g, " ").trim()
        : entry.kind === "richText"
          ? richTextPlainText(entry.value)
          : "";
    if (text) return textExcerpt(text, maxLength);
  }
  return null;
}

// Ключи галерей из полей-галерей и rich text всех блоков — чтобы загрузить их одним
// запросом до вывода.
export function collectBlockGalleryKeys(blocks: readonly Block[]): string[] {
  const keys = new Set<string>();
  for (const entry of blockValues(blocks)) {
    if (entry.kind === "gallery" && entry.value) keys.add(entry.value);
    if (entry.kind === "richText") for (const key of collectGalleryKeys(entry.value)) keys.add(key);
  }
  return [...keys];
}

// id документов из блоков — чтобы загрузить их одним запросом до вывода.
export function collectBlockDocumentIds(blocks: readonly Block[]): number[] {
  const ids = new Set<number>();
  for (const entry of blockValues(blocks)) {
    if (entry.kind === "document" && entry.value) ids.add(entry.value);
  }
  return [...ids];
}

// id картинок из блоков — для подсчёта использования media.
export function collectBlockMediaIds(blocks: readonly Block[]): number[] {
  const ids = new Set<number>();
  for (const entry of blockValues(blocks)) {
    if (entry.kind === "image" && entry.value) ids.add(entry.value.mediaId);
  }
  return [...ids];
}

// id страниц из ссылок блоков — чтобы загрузить их адреса одним запросом до вывода.
export function collectBlockPageIds(blocks: readonly Block[]): number[] {
  const ids = new Set<number>();
  for (const entry of blockValues(blocks)) {
    if (entry.kind === "link" && entry.value?.kind === "page") ids.add(entry.value.pageId);
  }
  return [...ids];
}
