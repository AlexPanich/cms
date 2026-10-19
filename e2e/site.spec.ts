import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { addToMainMenu, expectToast, insertPublishedPage, insertRootPages } from "./fixtures";

test("публичная страница: меню, раздел, крошки, поиск и sitemap", async ({ page, request }) => {
  const stamp = Date.now();
  const root = `e2e-site-${stamp}`;
  // Уникальное слово, чтобы поиск нашёл только эту страницу.
  const word = `зебра${stamp}`;
  await insertPublishedPage({ slug: root, title: `E2E Раздел ${stamp}` });
  await insertPublishedPage({
    slug: "child",
    title: `E2E Подстраница ${stamp}`,
    parentPath: root,
    paragraphs: [`Здесь живёт ${word} и <script>alert(1)</script>`],
  });
  await insertRootPages([`e2e-draft-${stamp}`]);
  await addToMainMenu(root);

  await page.goto(`/${root}/child`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`E2E Подстраница ${stamp}`);
  await expect(page).toHaveTitle(new RegExp(`^E2E Подстраница ${stamp} — `));
  // HTML из текста выводится как текст.
  await expect(page.getByText("<script>alert(1)</script>", { exact: false })).toBeVisible();

  const crumbs = page.getByRole("navigation", { name: "Хлебные крошки" });
  await expect(crumbs.getByRole("link")).toHaveText(["Главная", `E2E Раздел ${stamp}`]);
  const section = page.getByRole("navigation", { name: "Раздел" });
  await expect(section.getByRole("link", { name: `E2E Подстраница ${stamp}` })).toHaveAttribute(
    "aria-current",
    "page",
  );
  // Пункт главного меню подсвечен и на вложенной странице.
  await expect(
    page
      .getByRole("navigation", { name: "Главное меню" })
      .getByRole("link", { name: `E2E Раздел ${stamp}` }),
  ).toHaveAttribute("aria-current", "page");

  // Метаданные для поисковиков — в <head> исходного HTML, без стриминга.
  const html = await (await request.get(`/${root}/child`)).text();
  const head = html.slice(0, html.indexOf("</head>"));
  expect(head).toContain(`<link rel="canonical" href="${new URL(`/${root}/child`, page.url())}"/>`);
  expect(head).toMatch(new RegExp(`<meta name="description" content="Здесь живёт ${word}`));
  expect(head).toContain('<meta property="og:type" content="website"/>');
  expect(html).toContain('"@type":"BreadcrumbList"');
  // Текст — сразу в разметке, а не в скрытом блоке, который потом вставляет скрипт.
  expect(html).toMatch(new RegExp(`<p>Здесь живёт ${word}`));

  // Черновик и неверный адрес — настоящий 404 со страницей сайта и noindex.
  for (const path of [
    `/e2e-draft-${stamp}`,
    `/${root}/missing`,
    "/Bad_Path",
    "/articles/e2e-nope",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/не найдена$/);
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("navigation", { name: "Главное меню" })).toBeVisible();
  }

  // Поиск из шапки.
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Поиск по сайту" }).fill(word);
  await page.getByRole("searchbox", { name: "Поиск по сайту" }).press("Enter");
  await expect(page.getByRole("status")).toHaveText("Найдено: 1");
  await expect(page.locator("mark")).toHaveText(word);
  await page.getByRole("link", { name: `E2E Подстраница ${stamp}` }).click();
  await expect(page).toHaveURL(new RegExp(`/${root}/child$`));

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`/${root}/child</loc>`);
  expect(sitemap).not.toContain(`e2e-draft-${stamp}`);
});

test("галерея, вставленная в текст страницы через редактор", async ({ page }) => {
  const stamp = Date.now();
  const slug = `e2e-gallery-page-${stamp}`;
  const galleryTitle = `E2E Галерея ${stamp}`;
  await insertPublishedPage({
    slug,
    title: `E2E Страница с галереей ${stamp}`,
    paragraphs: ["Текст"],
  });

  // Галерея с одной картинкой.
  await page.goto("/admin/galleries/new");
  await page.getByRole("textbox", { name: "Название" }).fill(galleryTitle);
  await page.getByRole("textbox", { name: "Название" }).blur();
  await expect(page.getByRole("textbox", { name: "Ключ" })).toHaveValue(`e2e-galereya-${stamp}`);
  await page.getByRole("button", { name: "Создать галерею" }).click();
  await expectToast(page, "Галерея создана");
  await page.getByLabel("Файлы изображений").setInputFiles({
    name: `e2e-${stamp}.png`,
    mimeType: "image/png",
    buffer: await sharp({ create: { width: 64, height: 48, channels: 3, background: "#09f" } })
      .png()
      .toBuffer(),
  });
  await expectToast(page, "Загружено изображений: 1");
  await page.getByRole("button", { name: `Описание «e2e-${stamp}.png»` }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Описание" }).fill("Голубой");
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Описание сохранено");

  // Вставка в текст страницы.
  await page.goto("/admin/pages");
  await page.getByRole("link", { name: `E2E Страница с галереей ${stamp}`, exact: true }).click();
  await page.getByRole("button", { name: "Вставить галерею" }).click();
  await page.getByRole("combobox", { name: "Галерея" }).click();
  await page.getByRole("option", { name: galleryTitle }).click();
  await page.getByRole("button", { name: "Вставить", exact: true }).click();
  await expect(page.getByText(`Галерея «${galleryTitle}»`)).toBeVisible();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Страница сохранена");

  await page.goto(`/${slug}`);
  await expect(page.getByRole("img", { name: "Голубой" })).toBeVisible();
  await expect(page.getByText(galleryTitle, { exact: true })).toBeVisible();
});
