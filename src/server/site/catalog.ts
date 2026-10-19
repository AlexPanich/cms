import type { ContentContext } from "@/components/site/rich-text";
import { type BlockVariant, fieldReferences, walkFields } from "@/lib/blocks/define";
import {
  EXAMPLE_DOCUMENTS,
  EXAMPLE_GALLERY,
  EXAMPLE_IMAGES,
  EXAMPLE_PAGE,
  minimalExample,
} from "@/lib/blocks/examples";
import { type Block, BLOCKS, blockVariants } from "@/lib/blocks/registry";
import { readSiteSettings } from "@/lib/site-settings";
import type { PublicImage, PublishedArticleCard } from "./service";

// Каталог блоков /_blocks: каждый блок и вариант оформления на примере данных (example из
// defineBlock). Данные для ссылок и виджетов — заглушки, а не записи из БД: каталог выглядит
// одинаково на любой установке, и по нему можно проверить тему до наполнения сайта.

const COLORS = ["#94a3b8", "#a8a29e", "#86c5a4", "#d4a373", "#8fa7d6", "#c99ab8"];

// Картинка-заглушка: SVG в data URI, next/image выводит такие без оптимизации.
function placeholder(index: number, alt: string): PublicImage {
  const [width, height] = [1600, 1200];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${COLORS[index % COLORS.length]}"/><path d="M0 1200 560 640l340 340 260-220 440 440Z" fill="#fff" fill-opacity=".35"/><circle cx="1180" cy="360" r="120" fill="#fff" fill-opacity=".5"/></svg>`;
  return { url: `data:image/svg+xml,${encodeURIComponent(svg)}`, alt, width, height };
}

const images = EXAMPLE_IMAGES.map((id, index) => placeholder(index, `Пример картинки ${id}`));

const articles: PublishedArticleCard[] = [
  "Как ухаживать за мебелью из массива",
  "Дуб или ясень: что выбрать для кухни",
  "Открыли шоурум на Лесной улице",
  "Почему мы сушим древесину полгода",
  "Новая коллекция столов",
  "Скидка на кухни до конца месяца",
  "Как проходит замер",
  "Мебель для детской: безопасные покрытия",
  "Итоги года в мастерской",
].map((title, index) => ({
  slug: `primer-${index + 1}`,
  title,
  excerpt: null,
  publishedAt: new Date(Date.UTC(2026, 0, 20 - index)),
  previewUrl: images[index % images.length].url,
  previewAlt: "",
}));

export const CATALOG_CONTEXT: ContentContext = {
  galleries: new Map([
    [EXAMPLE_GALLERY, { title: "Пример галереи", images: [...images, ...images].slice(0, 6) }],
  ]),
  links: new Map([[EXAMPLE_PAGE, { href: "#", title: "О компании" }]]),
  images: new Map(EXAMPLE_IMAGES.map((id, index) => [id, images[index]])),
  documents: new Map(
    EXAMPLE_DOCUMENTS.map((id, index) => [
      id,
      {
        url: "#",
        title: ["Прайс-лист", "Договор на изготовление", "Каталог материалов"][index],
        size: [184_000, 92_000, 6_400_000][index],
        extension: ["pdf", "docx", "pdf"][index],
      },
    ]),
  ),
  articles,
  settings: readSiteSettings({
    logo: { mediaId: EXAMPLE_IMAGES[0], alt: "" },
    phone: "+7 (900) 000-00-00",
    email: "hello@example.com",
    address: "Тверь, ул. Лесная, 12",
    hours: "пн–сб 9:00–19:00\nвс — выходной",
    socials: [
      { network: "vk", url: "https://vk.com/" },
      { network: "telegram", url: "https://t.me/" },
    ],
  }),
};

export type CatalogExample = {
  // Подпись примера: оформление или «Только обязательные поля».
  label: string;
  variant: BlockVariant | null;
  block: Block;
};

export type CatalogEntry = {
  type: string;
  label: string;
  description: string;
  examples: CatalogExample[];
};

// Для каждого блока: пример в оформлении по умолчанию и в каждом варианте темы, затем
// пустое состояние — если оно отличается от полного примера.
export function catalogEntries(): CatalogEntry[] {
  return BLOCKS.map((definition) => {
    const data = definition.schema.parse(definition.example) as Record<string, unknown>;
    const minimal = minimalExample(definition.fields, data);
    const block = (id: string, variant: string | null, values: unknown) =>
      ({ id, type: definition.type, variant, data: values }) as Block;
    const variants = blockVariants(definition.type);
    return {
      type: definition.type,
      label: definition.label,
      description: definition.description,
      examples: [
        { label: "Оформление по умолчанию", variant: null, block: block("default", null, data) },
        ...variants.map((variant) => ({
          label: `Оформление «${variant.label}»`,
          variant,
          block: block(variant.key, variant.key, data),
        })),
        ...(JSON.stringify(minimal) === JSON.stringify(data)
          ? []
          : [
              {
                label: "Только обязательные поля",
                variant: null,
                block: block("minimal", null, minimal),
              },
            ]),
      ],
    };
  });
}

// Ссылки примера, которых нет в каталоге: пример ссылается на настоящие данные, и на сайте
// поле осталось бы пустым. Для проверки в тестах.
export function unresolvedExampleReferences(
  fields: Parameters<typeof walkFields>[0],
  data: object,
) {
  const refs = fieldReferences(walkFields(fields, data as Record<string, unknown>));
  return [
    ...refs.imageIds.filter((id) => !CATALOG_CONTEXT.images.has(id)).map((id) => `image:${id}`),
    ...refs.documentIds
      .filter((id) => !CATALOG_CONTEXT.documents.has(id))
      .map((id) => `document:${id}`),
    ...refs.galleryKeys
      .filter((key) => !CATALOG_CONTEXT.galleries.has(key))
      .map((key) => `gallery:${key}`),
    ...refs.pageIds.filter((id) => !CATALOG_CONTEXT.links.has(id)).map((id) => `page:${id}`),
  ];
}
