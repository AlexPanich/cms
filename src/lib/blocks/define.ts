import { type RichTextDoc, richTextDocSchema } from "@/lib/rich-text";
import { isSafeLinkUrl } from "@/lib/url";
import { z } from "@/lib/zod";

// DSL полей блока. Тип блока описывается один раз, и из описания выводится всё остальное:
// zod-схема (сервер, форма, правка на сайте), текст для поиска, ссылки на media и страницы.
// Файл без серверных зависимостей: его импортируют формы в браузере и тема.
//
// Схемы блоков меняются только совместимо: новое поле необязательное или со значением
// по умолчанию, поля не переименовываются. Иначе сохранённые блоки перестанут проходить
// схему и пропадут с сайта до исправления.

type Common = {
  label: string;
  // Подсказка под полем в форме.
  help?: string;
};

// Необязательные поля хранят null, если не заполнены.
type Opt<R extends boolean, T> = R extends true ? T : T | null;

export type TextField = Common & {
  kind: "text";
  required: boolean;
  max: number;
  multiline: boolean;
  schema: z.ZodType<string>;
};

export type RichTextField<R extends boolean = boolean> = Common & {
  kind: "richText";
  required: R;
  schema: z.ZodType<Opt<R, RichTextDoc>>;
};

// alt пустой — берётся из карточки картинки в медиатеке.
export type ImageValue = { mediaId: number; alt: string };

export type ImageField<R extends boolean = boolean> = Common & {
  kind: "image";
  required: R;
  // Пропорции (ширина / высота), в которые тема кадрирует картинку; null — как есть.
  aspect: number | null;
  schema: z.ZodType<Opt<R, ImageValue>>;
};

// Ссылка на страницу хранит id: адрес страницы может измениться. Если страницу удалили
// или сняли с публикации, ссылка не выводится. label пустой — название страницы или адрес.
export type LinkValue =
  { kind: "page"; pageId: number; label: string } | { kind: "url"; url: string; label: string };

export type LinkField<R extends boolean = boolean> = Common & {
  kind: "link";
  required: R;
  schema: z.ZodType<Opt<R, LinkValue>>;
};

export type ListField<F extends Fields = Fields> = Common & {
  kind: "list";
  of: F;
  min: number;
  max: number;
  // Название одного элемента в форме: «Карточка», «Вопрос».
  itemLabel: string;
  schema: z.ZodType<FieldsData<F>[]>;
};

export type SelectOption<V extends string = string> = { value: V; label: string };

export type SelectField<V extends string = string> = Common & {
  kind: "select";
  options: readonly SelectOption<V>[];
  default: V;
  schema: z.ZodType<V>;
};

export type BooleanField = Common & {
  kind: "boolean";
  default: boolean;
  schema: z.ZodType<boolean>;
};

export type Field =
  TextField | RichTextField | ImageField | LinkField | ListField | SelectField | BooleanField;

// Интерфейс, а не Record: список содержит поля, и псевдоним типа замкнулся бы сам на себя.
export interface Fields {
  [name: string]: Field;
}

export type FieldsData<F extends Fields> = { [K in keyof F]: z.output<F[K]["schema"]> };

const REQUIRED = "Обязательное поле";

// Необязательное значение: отсутствует или null — null; обязательное — не null.
function optional<T>(schema: z.ZodType<T>, required: boolean) {
  const nullable = schema.nullable().default(null);
  return required ? nullable.refine((value) => value !== null, REQUIRED) : nullable;
}

const imageValueSchema = z.object({
  mediaId: z.number().int().positive(),
  alt: z.string().trim().max(300).default(""),
});

const linkLabelSchema = z.string().trim().max(100).default("");

const linkValueSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("page"),
    pageId: z.number().int().positive(),
    label: linkLabelSchema,
  }),
  z.object({
    kind: z.literal("url"),
    url: z
      .string()
      .trim()
      .max(2000)
      .refine(isSafeLinkUrl, "Ссылка должна начинаться с «/», http://, https://, mailto: или tel:"),
    label: linkLabelSchema,
  }),
]);

function fieldsSchema<F extends Fields>(fields: F) {
  const shape = Object.fromEntries(
    Object.entries(fields).map(([name, field]) => [name, field.schema]),
  ) as { [K in keyof F]: F[K]["schema"] };
  return z.object(shape);
}

export const field = {
  // Строка. multiline: false — без переносов (заголовки, подписи).
  text(options: Common & { required?: boolean; max?: number; multiline?: boolean }): TextField {
    const { required = false, max = 200, multiline = false, ...common } = options;
    let schema = z.string().trim().max(max);
    if (!multiline) schema = schema.regex(/^[^\r\n]*$/, "Без переносов строк");
    if (required) schema = schema.min(1, REQUIRED);
    // prefault, а не default: значение default zod не проверяет, и обязательное поле
    // без значения прошло бы пустой строкой. Так же у списка с min.
    return { ...common, kind: "text", required, max, multiline, schema: schema.prefault("") };
  },

  richText<const R extends boolean = false>(options: Common & { required?: R }): RichTextField<R> {
    const { required = false as R, ...common } = options;
    return {
      ...common,
      kind: "richText",
      required,
      schema: optional(richTextDocSchema, required) as z.ZodType<Opt<R, RichTextDoc>>,
    };
  },

  image<const R extends boolean = false>(
    options: Common & { required?: R; aspect?: number },
  ): ImageField<R> {
    const { required = false as R, aspect = null, ...common } = options;
    return {
      ...common,
      kind: "image",
      required,
      aspect,
      schema: optional(imageValueSchema, required) as z.ZodType<Opt<R, ImageValue>>,
    };
  },

  link<const R extends boolean = false>(options: Common & { required?: R }): LinkField<R> {
    const { required = false as R, ...common } = options;
    return {
      ...common,
      kind: "link",
      required,
      schema: optional(linkValueSchema, required) as z.ZodType<Opt<R, LinkValue>>,
    };
  },

  // Список однотипных элементов (карточки, вопросы). max обязателен: тема должна знать,
  // сколько элементов поместится.
  list<F extends Fields>(
    of: F,
    options: Common & { max: number; min?: number; itemLabel: string },
  ): ListField<F> {
    const { min = 0, max, itemLabel, ...common } = options;
    const schema = z.array(fieldsSchema(of)).min(min).max(max).prefault([]);
    return {
      ...common,
      kind: "list",
      of,
      min,
      max,
      itemLabel,
      schema: schema as unknown as z.ZodType<FieldsData<F>[]>,
    };
  },

  // Выбор из списка. Значение, которого больше нет в списке, заменяется значением по умолчанию.
  select<const V extends string>(
    options: Common & { options: readonly [SelectOption<V>, ...SelectOption<V>[]]; default?: V },
  ): SelectField<V> {
    const { options: list, default: fallback = list[0].value, ...common } = options;
    const values = list.map((option) => option.value) as [V, ...V[]];
    return {
      ...common,
      kind: "select",
      options: list,
      default: fallback,
      schema: z.enum(values).catch(fallback) as unknown as z.ZodType<V>,
    };
  },

  boolean(options: Common & { default?: boolean }): BooleanField {
    const { default: fallback = false, ...common } = options;
    return { ...common, kind: "boolean", default: fallback, schema: z.boolean().default(fallback) };
  },
};

// Тип блока: латиница в нижнем регистре и дефисы («media-text»). Хранится в данных
// страницы, поэтому не переименовывается.
export const BLOCK_TYPE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type BlockDefinition<T extends string = string, F extends Fields = Fields> = {
  type: T;
  // Название в каталоге и в редакторе.
  label: string;
  // Для редактора и дизайнера: что это за блок и когда его брать.
  description: string;
  fields: F;
  schema: z.ZodType<FieldsData<F>>;
};

export function defineBlock<const T extends string, F extends Fields>(definition: {
  type: T;
  label: string;
  description: string;
  fields: F;
}): BlockDefinition<T, F> {
  if (!BLOCK_TYPE_PATTERN.test(definition.type)) {
    throw new Error(`Недопустимый тип блока: ${definition.type}`);
  }
  return {
    ...definition,
    schema: fieldsSchema(definition.fields) as unknown as z.ZodType<FieldsData<F>>,
  };
}

// Вариант оформления блока объявляет тема (src/theme/blocks/): «картинка справа»,
// «на тёмном фоне». Без варианта блок рисуется в оформлении по умолчанию.
export type BlockVariant = { key: string; label: string };

export type BlockVariants = Record<string, readonly BlockVariant[]>;

// Поле вместе со значением: kind сужает и поле, и значение.
export type FieldEntry = {
  [K in Field["kind"]]: {
    kind: K;
    field: Extract<Field, { kind: K }>;
    value: z.output<Extract<Field, { kind: K }>["schema"]>;
  };
}[Field["kind"]];

// Обход полей вместе со значениями, включая элементы списков. Данные уже прошли схему.
export function* walkFields(fields: Fields, data: Record<string, unknown>): Generator<FieldEntry> {
  for (const [name, item] of Object.entries(fields)) {
    const entry = { kind: item.kind, field: item, value: data[name] } as FieldEntry;
    yield entry;
    if (entry.kind === "list") {
      for (const element of entry.value) yield* walkFields(entry.field.of, element);
    }
  }
}
