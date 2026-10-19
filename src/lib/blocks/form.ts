import type { Field, Fields } from "./define";
import { BLOCK_ID_PATTERN, getBlockDefinition, resolveBlockVariant } from "./registry";

// Данные блоков для формы редактора. Блок из БД мог не пройти схему (поле удалили из темы,
// данные записаны в обход сервиса) — тогда в форму попадают годные значения, а вместо
// негодных пустые. Форма покажет ошибки, и блок можно исправить, а не только удалить.

export type FormBlock = { id: string; type: string; variant: string | null; data: unknown };

// Пустое значение поля: у нового блока и вместо значения, которое не прошло схему.
export function emptyFieldValue(item: Field): unknown {
  switch (item.kind) {
    case "text":
      return "";
    case "list":
      return [];
    case "select":
      return item.default;
    case "boolean":
      return item.default;
    default:
      return null;
  }
}

function fieldValue(item: Field, raw: unknown): unknown {
  const parsed = item.schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  if (item.kind === "list" && Array.isArray(raw)) {
    return raw.slice(0, item.max).map((element) => fieldsFormData(item.of, element));
  }
  return emptyFieldValue(item);
}

// Значения полей для формы: у нового блока — пустые, у сохранённого — что удалось прочитать.
export function fieldsFormData(fields: Fields, raw: unknown = {}): Record<string, unknown> {
  const data = raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    Object.entries(fields).map(([name, item]) => [name, fieldValue(item, data[name])]),
  );
}

// Блоки страницы из БД для формы. Блок неизвестного типа остаётся как есть: редактор
// предложит его удалить, а сохранить страницу с ним нельзя.
export function blocksFormValue(raw: unknown): FormBlock[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.map((item: unknown) => {
    const stored = (item !== null && typeof item === "object" ? item : {}) as Record<
      string,
      unknown
    >;
    // id нужен, чтобы блок можно было найти и сохранить; битый или повторный заменяем.
    let id = typeof stored.id === "string" ? stored.id : "";
    if (!BLOCK_ID_PATTERN.test(id) || seen.has(id)) id = crypto.randomUUID();
    seen.add(id);
    const type = typeof stored.type === "string" ? stored.type : "";
    const definition = getBlockDefinition(type);
    const variant = typeof stored.variant === "string" ? stored.variant : null;
    if (!definition) return { id, type, variant, data: stored.data ?? {} };
    return {
      id,
      type,
      variant: resolveBlockVariant(type, variant),
      data: fieldsFormData(definition.fields, stored.data),
    };
  });
}

// Есть ли у блока поле такого вида, включая поля внутри списков: редактору на сайте
// нужны галереи только для rich text, а страницы — только для ссылок.
export function hasFieldKind(fields: Fields, kind: Field["kind"]): boolean {
  return Object.values(fields).some(
    (item) => item.kind === kind || (item.kind === "list" && hasFieldKind(item.of, kind)),
  );
}
