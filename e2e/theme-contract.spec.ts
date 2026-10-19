import { expect, type Page, test } from "@playwright/test";
import { BLOCKS } from "../src/lib/blocks/registry";
import { addToMainMenu, insertArticle, insertPublishedPage, resetSiteCache } from "./fixtures";

// Контракт темы (src/components/site/theme.ts): то, на что опираются доступность, правка на
// сайте и остальные E2E. Тест не знает, как выглядит тема, и проходит на любой — в CI его
// гоняют и на теме по умолчанию, и на второй теме (e2e/theme, scripts/theme-contract.sh).

async function expectContract(page: Page, title?: string) {
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  const main = page.getByRole("main");
  await expect(main).toHaveAttribute("id", "content");
  await expect(page.getByRole("link", { name: "К содержимому" })).toHaveAttribute(
    "href",
    "#content",
  );
  await expect(page.getByRole("search").first()).toBeAttached();
  // Ровно один h1 на странице.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  if (title) await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
}

test("страницы сайта: landmarks, ссылка «К содержимому», один h1", async ({ page }) => {
  const stamp = Date.now();
  const slug = `e2e-kontrakt-${stamp}`;
  const title = `E2E Контракт ${stamp}`;
  await insertPublishedPage({ slug, title, paragraphs: [`Абзац контракта ${stamp}`] });
  // Шаблона может не быть в теме — страница рисуется шаблоном default.
  await insertPublishedPage({
    slug: `e2e-propavshiy-shablon-${stamp}`,
    title: `E2E Без шаблона ${stamp}`,
    template: `e2e-missing-${stamp}`,
  });
  await addToMainMenu(slug);
  await insertArticle(`e2e-kontrakt-${stamp}`, `E2E Статья контракта ${stamp}`);
  await resetSiteCache(page);

  await page.goto(`/${slug}`);
  await expectContract(page, title);
  await expect(page.getByRole("main").getByText(`Абзац контракта ${stamp}`)).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Главное меню" }).getByRole("link", { name: title }),
  ).toBeVisible();

  await page.goto(`/e2e-propavshiy-shablon-${stamp}`);
  await expectContract(page, `E2E Без шаблона ${stamp}`);

  await page.goto("/articles");
  await expectContract(page);
  await page.getByRole("link", { name: `E2E Статья контракта ${stamp}` }).click();
  await expectContract(page, `E2E Статья контракта ${stamp}`);

  await page.goto(`/search?q=${encodeURIComponent(`контракта ${stamp}`)}`);
  await expectContract(page);
  await expect(page.getByRole("main").getByRole("link", { name: title })).toBeVisible();

  const response = await page.goto(`/e2e-net-takoy-${stamp}`);
  expect(response?.status()).toBe(404);
  await expectContract(page);
});

test("правка на сайте: обёртки Editable… вокруг полей", async ({ page }) => {
  const stamp = Date.now();
  const slug = `e2e-kontrakt-pravka-${stamp}`;
  await insertPublishedPage({
    slug,
    title: `E2E Правка контракта ${stamp}`,
    paragraphs: ["Текст"],
  });
  await resetSiteCache(page);

  await page.goto(`/${slug}`);
  await page.getByRole("button", { name: "Править на сайте" }).click();
  for (const name of [
    "Изменить заголовок",
    "Изменить блок «Текст»",
    "Изменить: название сайта",
    "Изменить: текст в подвале",
    "Изменить: контакты",
  ]) {
    await expect(page.getByRole("button", { name }).first()).toBeVisible();
  }
});

test("каталог /_blocks: каждый блок ядра и темы", async ({ page }) => {
  await page.goto("/_blocks");
  await expectContract(page, "Каталог блоков");
  for (const block of BLOCKS) {
    await expect(page.getByRole("region", { name: new RegExp(`^${block.label}`) })).toBeVisible();
  }
});
