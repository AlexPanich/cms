import { expect, type Page, test } from "@playwright/test";
import sharp from "sharp";
import { blockVariants } from "../src/lib/blocks/registry";
import {
  expectToast,
  insertArticle,
  insertGallery,
  insertMedia,
  insertPublishedPage,
  resetSiteCache,
} from "./fixtures";

const png = () =>
  sharp({ create: { width: 64, height: 36, channels: 3, background: "#09f" } })
    .png()
    .toBuffer();

async function addBlock(page: Page, label: string) {
  await page.getByRole("button", { name: "Добавить блок" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(`^${label}`) })
    .click();
}

// Выбор в Base UI Select: открыть список и выбрать пункт.
async function choose(
  page: Page,
  scope: ReturnType<Page["getByRole"]>,
  name: string,
  option: string,
) {
  await scope.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("блоки каталога: картинка, ссылки, список и оформление из админки, правка на сайте", async ({
  page,
}) => {
  const stamp = Date.now();
  const title = `E2E Лендинг ${stamp}`;
  const slug = `e2e-lending-${stamp}`;
  const target = `E2E Цель ${stamp}`;
  await insertPublishedPage({ slug: `e2e-cel-${stamp}`, title: target });

  await page.goto("/admin/pages/new");
  await page.getByLabel("Заголовок", { exact: true }).first().fill(title);
  await page.getByLabel("Заголовок", { exact: true }).first().blur();
  await page.getByRole("checkbox", { name: "Опубликована" }).click();

  // Первый экран: картинка загружается сразу, кнопка ведёт на адрес.
  await addBlock(page, "Первый экран");
  const hero = page.getByRole("listitem", { name: "Блок «Первый экран» (1)" });
  await hero
    .getByRole("textbox", { name: "Заголовок", exact: true })
    .fill(`Добро пожаловать ${stamp}`);
  await hero.getByRole("textbox", { name: "Подзаголовок" }).fill("Делаем сайты");
  await choose(page, hero, "Кнопка: куда ведёт", "Другой адрес");
  await hero.getByRole("textbox", { name: "Кнопка: адрес" }).fill("/articles");
  await hero.getByRole("textbox", { name: "Кнопка: подпись" }).fill("К статьям");
  await hero.getByLabel("Картинка").setInputFiles({
    name: "hero.png",
    mimeType: "image/png",
    buffer: await png(),
  });
  await expect(hero.getByRole("button", { name: "Заменить" })).toBeVisible();
  await hero.getByRole("textbox", { name: "Описание картинки (alt)" }).fill("Синий фон");

  // Карточки: список с минимумом в один элемент.
  await addBlock(page, "Карточки");
  const features = page.getByRole("listitem", { name: "Блок «Карточки» (2)" });
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expect(features.getByText("Нужно исправить")).toBeVisible();
  await features.getByRole("button", { name: "Добавить: карточка" }).click();
  await features.getByRole("textbox", { name: "Заголовок", exact: true }).nth(1).fill("Быстро");
  await features.getByRole("textbox", { name: "Текст", exact: true }).fill("За неделю");
  await choose(page, features, "Иконка", "Молния");

  // Призыв к действию: кнопка на страницу сайта и вариант оформления, если тема его объявила
  // (варианты — у каждой темы свои, поэтому берём из реестра).
  await addBlock(page, "Призыв к действию");
  const cta = page.getByRole("listitem", { name: "Блок «Призыв к действию» (3)" });
  const [ctaVariant] = blockVariants("cta");
  if (ctaVariant) await choose(page, cta, "Оформление", ctaVariant.label);
  await cta.getByRole("textbox", { name: "Заголовок", exact: true }).fill("Остались вопросы?");
  await choose(page, cta, "Кнопка: куда ведёт", "Страница сайта");
  await choose(page, cta, "Кнопка: страница", target);

  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expectToast(page, "Страница создана");

  await page.goto(`/${slug}`);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: `Добро пожаловать ${stamp}` })).toBeVisible();
  // h1 есть всегда, даже если страница начинается с «Первого экрана» (показывать ли его, решает тема).
  await expect(main.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(main.getByRole("link", { name: "К статьям" })).toHaveAttribute("href", "/articles");
  await expect(main.getByRole("img", { name: "Синий фон" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "Быстро" })).toBeVisible();
  await expect(main.getByRole("link", { name: target })).toHaveAttribute(
    "href",
    `/e2e-cel-${stamp}`,
  );

  // На сайте блок правится той же формой в диалоге.
  await page.getByRole("button", { name: "Править на сайте" }).click();
  await page.getByRole("button", { name: "Изменить блок «Призыв к действию»" }).click();
  const dialog = page.getByRole("dialog", { name: "Блок «Призыв к действию»" });
  await dialog.getByRole("textbox", { name: "Заголовок", exact: true }).fill("Звоните!");
  await dialog.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Блок сохранён");
  await expect(main.getByRole("heading", { name: "Звоните!" })).toBeVisible();
});

test("блоки с данными из разделов: галерея, документы, статьи, вопросы", async ({ page }) => {
  const stamp = Date.now();
  const slug = `e2e-razdely-${stamp}`;
  const image = await insertMedia({ kind: "image", name: `e2e-foto-${stamp}` });
  const document = await insertMedia({
    kind: "document",
    name: "price",
    title: `E2E Прайс ${stamp}`,
  });
  const removed = 2_000_000_000; // документа с таким id нет — он не выводится
  await insertGallery(`e2e-galereya-${stamp}`, `E2E Галерея ${stamp}`, [image]);
  await insertArticle(`e2e-statya-${stamp}`, `E2E Статья ${stamp}`);
  const answer = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Ответ про доставку" }] }],
  };
  await insertPublishedPage({
    slug,
    title: `E2E Разделы ${stamp}`,
    blocks: [
      { type: "gallery", data: { title: "Фото", gallery: `e2e-galereya-${stamp}` } },
      {
        type: "documents",
        data: { title: "Файлы", items: [{ document, title: "" }, { document: removed }] },
      },
      { type: "articles", data: { title: "Новости", count: "3", showAll: true } },
      { type: "faq", data: { items: [{ question: "Как доставляете?", answer }] } },
    ],
  });
  await resetSiteCache(page);

  await page.goto(`/${slug}`);
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Фото" })).toBeVisible();
  await expect(main.getByText(`E2E Галерея ${stamp}`)).toBeVisible();

  const file = main.getByRole("link", { name: new RegExp(`E2E Прайс ${stamp}`) });
  // Тип и размер файла — без привязки к тому, как тема их разделяет.
  await expect(file).toContainText("PDF");
  await expect(file).toContainText("2 КБ");
  // Удалённый документ не выводится: на странице одна ссылка на файл (адрес задаёт ядро, не тема).
  await expect(main.getByRole("heading", { name: "Файлы" })).toBeVisible();
  await expect(main.locator('a[href^="/media/documents/"]')).toHaveCount(1);

  await expect(main.getByRole("heading", { name: "Новости" })).toBeVisible();
  await expect(main.getByRole("link", { name: `E2E Статья ${stamp}` })).toBeVisible();
  await expect(main.getByRole("link", { name: "Все статьи" })).toHaveAttribute("href", "/articles");

  await expect(main.getByText("Ответ про доставку")).toBeHidden();
  await main.getByText("Как доставляете?").click();
  await expect(main.getByText("Ответ про доставку")).toBeVisible();
});
