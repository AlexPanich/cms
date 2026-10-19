import { SITE_SETTINGS } from "@/lib/site-settings";
import type { Field, Fields, TextFormat } from "./define";
import { BLOCKS, blockVariants } from "./registry";

// Текст docs/BLOCKS.md — описание блоков и настроек сайта для дизайнера. Собирается из кода
// (pnpm blocks:catalog), CI проверяет, что файл не устарел.

const KIND_LABELS: Record<Field["kind"], string> = {
  text: "строка",
  richText: "форматированный текст",
  image: "картинка",
  link: "ссылка",
  gallery: "галерея",
  document: "документ",
  list: "список",
  select: "выбор",
  boolean: "флажок",
};

const FORMAT_LABELS: Record<TextFormat, string> = {
  email: "адрес почты",
  phone: "телефон",
  url: "адрес http:// или https://",
};

// Пропорции дробью: 16/9 → «16:9». Знаменатель до 20 — для пропорций, которые задают руками.
export function formatAspect(aspect: number): string {
  for (let height = 1; height <= 20; height++) {
    const width = Math.round(aspect * height);
    if (Math.abs(width / height - aspect) < 1e-6) return `${width}:${height}`;
  }
  return aspect.toFixed(2);
}

function constraints(item: Field): string[] {
  switch (item.kind) {
    case "text":
      return [
        `до ${item.max} символов`,
        item.multiline ? "можно в несколько строк" : "одной строкой",
        ...(item.format ? [FORMAT_LABELS[item.format]] : []),
      ];
    case "image":
      return [item.aspect ? `кадрируется в ${formatAspect(item.aspect)}` : "пропорции любые"];
    case "link":
      return ["страница сайта или адрес, подпись необязательна"];
    case "list":
      return [
        item.min > 0 ? `от ${item.min} до ${item.max}` : `до ${item.max}`,
        `элемент — «${item.itemLabel}»`,
      ];
    case "select":
      return [
        item.options
          .map((option) =>
            option.value === item.default ? `${option.label} (по умолчанию)` : option.label,
          )
          .join(", "),
      ];
    case "boolean":
      return [`по умолчанию ${item.default ? "включён" : "выключен"}`];
    default:
      return [];
  }
}

const isRequired = (item: Field) =>
  "required" in item ? item.required : item.kind === "list" && item.min > 0;

function fieldRows(fields: Fields, prefix = ""): string[] {
  return Object.entries(fields).flatMap(([name, item]) => {
    const path = `${prefix}${name}`;
    const notes = [constraints(item).join("; "), item.help].filter(Boolean).join(". ");
    const row = `| ${prefix ? "↳ " : ""}${item.label} (\`${path}\`) | ${KIND_LABELS[item.kind]} | ${isRequired(item) ? "да" : "нет"} | ${notes} |`;
    return item.kind === "list" ? [row, ...fieldRows(item.of, `${path}[].`)] : [row];
  });
}

function fieldsTable(fields: Fields): string {
  return [
    "| Поле | Вид | Обязательное | Ограничения |",
    "| --- | --- | --- | --- |",
    ...fieldRows(fields),
  ].join("\n");
}

export function renderBlocksDoc(): string {
  const parts = [
    "# Каталог блоков",
    "<!-- Файл создаёт `pnpm blocks:catalog` из описаний блоков (src/lib/blocks/catalog.ts, src/theme/blocks/) и настроек сайта (src/lib/site-settings.ts, src/theme/settings.ts). Руками не правится. -->",
    "Страница сайта — вертикальная стопка блоков между общими шапкой и подвалом. Здесь перечислены блоки, которые есть в этой установке, их поля и ограничения. Как блоки выглядят в теме — живой каталог `/_blocks` (нужен вход в админку). Правила для макета — [DESIGN-GUIDE.md](DESIGN-GUIDE.md).",
    "Необязательное поле может быть пустым: у блока должно быть оформление и без него. Длина текста — любая до указанного предела.",
    "## Блоки",
    BLOCKS.map((block) => `- ${block.label} (\`${block.type}\`) — ${block.description}`).join("\n"),
  ];
  for (const block of BLOCKS) {
    const variants = blockVariants(block.type);
    parts.push(
      `## ${block.label} (\`${block.type}\`)`,
      block.description,
      `Оформление: по умолчанию${variants.map((variant) => `, «${variant.label}» (\`${variant.key}\`)`).join("")}.`,
      fieldsTable(block.fields),
    );
  }
  parts.push(
    "## Настройки сайта",
    "Общие для всего сайта: правятся в админке («Настройки сайта») и выводятся в шапке, подвале и блоке «Контакты». Название сайта, описание для поисковиков и текст в подвале — в разделе «Тексты».",
    fieldsTable(SITE_SETTINGS),
  );
  return `${parts.join("\n\n")}\n`;
}
