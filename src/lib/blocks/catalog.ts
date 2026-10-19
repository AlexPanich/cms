import { defineBlock, field } from "./define";
import {
  EXAMPLE_DOCUMENTS,
  EXAMPLE_GALLERY,
  EXAMPLE_PAGE,
  exampleDoc,
  exampleImage,
} from "./examples";

// Базовый каталог блоков ядра. Тема обязана нарисовать каждый, а свои типы добавляет
// в src/theme/blocks/. Блок, который пригодится другим клиентам, переносится сюда.
// Описание — для редактора и дизайнера: что это за блок и когда его брать. Пример —
// для каталога /_blocks: тексты реалистичной длины, чтобы по нему можно было проверить тему.

// Обычная текстовая страница — один такой блок.
export const textBlock = defineBlock({
  type: "text",
  label: "Текст",
  description: "Форматированный текст: заголовки, списки, ссылки, картинки, галереи",
  fields: {
    content: field.richText({ label: "Текст", required: true }),
  },
  example: {
    content: exampleDoc(
      "## О мастерской",
      "Мы делаем мебель из массива дуба и ясеня под размеры вашей квартиры. Каждый заказ начинается с замера и эскиза, а заканчивается сборкой на месте.",
      "Работаем с 2012 года, на изделия даём гарантию пять лет.",
    ),
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
  example: {
    title: "Мебель из массива на заказ",
    subtitle: "Проектируем, изготавливаем и собираем за шесть недель. Замер и эскиз — бесплатно.",
    button: { kind: "page", pageId: EXAMPLE_PAGE, label: "Рассчитать стоимость" },
    image: exampleImage(0, "Мастерская"),
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
  example: {
    title: "Почему выбирают нас",
    intro: "Отвечаем за результат на каждом этапе: от замера до сборки.",
    items: [
      {
        icon: "clock",
        image: null,
        title: "Точно в срок",
        text: "Сроки фиксируем в договоре и не переносим.",
        link: null,
      },
      {
        icon: "shield",
        image: null,
        title: "Гарантия пять лет",
        text: "Бесплатно устраним любой дефект производства.",
        link: { kind: "page", pageId: EXAMPLE_PAGE, label: "Условия гарантии" },
      },
      {
        icon: "truck",
        image: null,
        title: "Доставка и сборка",
        text: "Привезём и соберём сами, вывезем упаковку.",
        link: null,
      },
    ],
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
  example: {
    title: "Своё производство",
    content: exampleDoc(
      "Цех площадью 600 м² в Твери: станки с ЧПУ, покрасочная камера и склад высушенной древесины.",
      "Приезжайте посмотреть, как делается ваша мебель.",
    ),
    image: exampleImage(1, "Цех"),
    button: { kind: "page", pageId: EXAMPLE_PAGE, label: "Записаться на экскурсию" },
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
  example: { title: "Наши работы", gallery: EXAMPLE_GALLERY },
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
  example: {
    title: "Обсудим ваш проект?",
    text: "Оставьте заявку — перезвоним в течение часа и договоримся о замере.",
    button: { kind: "page", pageId: EXAMPLE_PAGE, label: "Оставить заявку" },
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
  example: {
    title: "Частые вопросы",
    items: [
      {
        question: "Сколько стоит замер?",
        answer: exampleDoc("Замер в пределах города бесплатный, за городом — 1000 ₽."),
      },
      {
        question: "Можно ли изменить проект после договора?",
        answer: exampleDoc(
          "Да, до начала производства. Сроки и цена пересчитываются, если меняются материалы.",
        ),
      },
      {
        question: "Как оплатить заказ?",
        answer: exampleDoc("Половина — при заключении договора, остальное — после сборки."),
      },
    ],
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
  example: { title: "Новости мастерской", count: "3", showAll: true },
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
  example: {
    title: "Документы",
    items: EXAMPLE_DOCUMENTS.map((document) => ({ document, title: "" })),
  },
});

// Контакты не хранятся в блоке: их берут из настроек сайта (src/lib/site-settings.ts),
// чтобы телефон или адрес менялись в одном месте для всех страниц.
export const contactsBlock = defineBlock({
  type: "contacts",
  label: "Контакты",
  description:
    "Телефон, почта, адрес, часы работы и соцсети из раздела «Настройки сайта» — для страницы контактов",
  fields: {
    title: field.text({ label: "Заголовок", max: 120 }),
    intro: field.text({ label: "Вступление", max: 300, multiline: true }),
    showSocials: field.boolean({ label: "Показывать соцсети", default: true }),
  },
  example: {
    title: "Как нас найти",
    intro: "Шоурум открыт каждый день, кроме воскресенья. Лучше позвонить заранее.",
    showSocials: true,
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
  contactsBlock,
] as const;

// Больше всего статей, которое может попросить блок «Последние статьи».
export const MAX_LATEST_ARTICLES = 9;
