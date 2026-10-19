import { defineBlock, field } from "./define";

// Базовый каталог блоков ядра. Тема обязана нарисовать каждый, а свои типы добавляет
// в src/theme/blocks/. Блок, который пригодится другим клиентам, переносится сюда.
// Описание — для редактора и дизайнера: что это за блок и когда его брать.

// Обычная текстовая страница — один такой блок.
export const textBlock = defineBlock({
  type: "text",
  label: "Текст",
  description: "Форматированный текст: заголовки, списки, ссылки, картинки, галереи",
  fields: {
    content: field.richText({ label: "Текст", required: true }),
  },
});

export const heroBlock = defineBlock({
  type: "hero",
  label: "Первый экран",
  description:
    "Крупный заголовок с подзаголовком, кнопкой и картинкой — начало главной или лендинга",
  fields: {
    title: field.text({ label: "Заголовок", required: true, max: 120 }),
    subtitle: field.text({ label: "Подзаголовок", max: 300, multiline: true }),
    button: field.link({ label: "Кнопка" }),
    image: field.image({ label: "Картинка", aspect: 16 / 9 }),
  },
});

// Ключи иконок для карточек. Как выглядит каждая, решает тема; новые ключи добавляются
// в конец, существующие не переименовываются.
export const FEATURE_ICONS = [
  { value: "none", label: "Без иконки" },
  { value: "check", label: "Галочка" },
  { value: "star", label: "Звезда" },
  { value: "heart", label: "Сердце" },
  { value: "shield", label: "Щит" },
  { value: "clock", label: "Часы" },
  { value: "truck", label: "Доставка" },
  { value: "phone", label: "Телефон" },
  { value: "mail", label: "Почта" },
  { value: "map-pin", label: "Место" },
  { value: "users", label: "Люди" },
  { value: "award", label: "Награда" },
  { value: "zap", label: "Молния" },
] as const;

export type FeatureIcon = (typeof FEATURE_ICONS)[number]["value"];

export const featuresBlock = defineBlock({
  type: "features",
  label: "Карточки",
  description:
    "Преимущества, услуги или шаги: карточки с иконкой или картинкой, заголовком и текстом",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    intro: field.text({ label: "Вступление", max: 300, multiline: true }),
    items: field.list(
      {
        icon: field.select({ label: "Иконка", options: FEATURE_ICONS }),
        image: field.image({ label: "Картинка", aspect: 4 / 3, help: "Вместо иконки" }),
        title: field.text({ label: "Заголовок", required: true, max: 80 }),
        text: field.text({ label: "Текст", max: 300, multiline: true }),
        link: field.link({ label: "Ссылка" }),
      },
      { label: "Карточки", itemLabel: "Карточка", min: 1, max: 12 },
    ),
  },
});

export const mediaTextBlock = defineBlock({
  type: "media-text",
  label: "Картинка и текст",
  description: "Картинка рядом с текстом: о компании, услуга, рассказ",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    content: field.richText({ label: "Текст", required: true }),
    image: field.image({ label: "Картинка", required: true, aspect: 4 / 3 }),
    button: field.link({ label: "Кнопка" }),
  },
});

export const galleryBlock = defineBlock({
  type: "gallery",
  label: "Галерея",
  description: "Картинки из раздела «Галереи»",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    gallery: field.gallery({ label: "Галерея", required: true }),
  },
});

export const ctaBlock = defineBlock({
  type: "cta",
  label: "Призыв к действию",
  description: "Короткий текст и кнопка: записаться, позвонить, оставить заявку",
  fields: {
    title: field.text({ label: "Заголовок", required: true, max: 120 }),
    text: field.text({ label: "Текст", max: 300, multiline: true }),
    button: field.link({ label: "Кнопка", required: true }),
  },
});

export const faqBlock = defineBlock({
  type: "faq",
  label: "Вопросы и ответы",
  description: "Список вопросов, ответ раскрывается по нажатию",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    items: field.list(
      {
        question: field.text({ label: "Вопрос", required: true, max: 200 }),
        answer: field.richText({ label: "Ответ", required: true }),
      },
      { label: "Вопросы", itemLabel: "Вопрос", min: 1, max: 30 },
    ),
  },
});

export const articlesBlock = defineBlock({
  type: "articles",
  label: "Последние статьи",
  description: "Свежие опубликованные статьи и ссылка на все статьи",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    count: field.select({
      label: "Сколько статей",
      options: [
        { value: "3", label: "3" },
        { value: "6", label: "6" },
        { value: "9", label: "9" },
      ],
    }),
    showAll: field.boolean({ label: "Ссылка «Все статьи»", default: true }),
  },
});

export const documentsBlock = defineBlock({
  type: "documents",
  label: "Документы",
  description: "Список файлов для скачивания из раздела «Документы»",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    items: field.list(
      {
        document: field.document({ label: "Документ", required: true }),
        title: field.text({
          label: "Название",
          max: 200,
          help: "Если пусто — название документа",
        }),
      },
      { label: "Документы", itemLabel: "Документ", min: 1, max: 50 },
    ),
  },
});

export const CORE_BLOCKS = [
  textBlock,
  heroBlock,
  featuresBlock,
  mediaTextBlock,
  galleryBlock,
  ctaBlock,
  faqBlock,
  articlesBlock,
  documentsBlock,
] as const;

// Больше всего статей, которое может попросить блок «Последние статьи».
export const MAX_LATEST_ARTICLES = 9;
