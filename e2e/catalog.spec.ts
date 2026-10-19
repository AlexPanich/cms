import { expect, test } from "@playwright/test";
import { BLOCKS, blockVariants } from "../src/lib/blocks/registry";

test("каталог блоков: каждый блок и вариант в стилях темы, без индексации", async ({ page }) => {
  const response = await page.goto("/_blocks");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Каталог блоков" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  for (const block of BLOCKS) {
    const section = page.getByRole("region", { name: new RegExp(`^${block.label}`) });
    await expect(section).toBeVisible();
    for (const variant of blockVariants(block.type)) {
      await expect(section.getByText(`Оформление «${variant.label}»`)).toBeVisible();
    }
  }
  // Данные-заглушки выводятся, как настоящие: картинки, документы, статьи, контакты.
  const main = page.getByRole("main");
  await expect(main.getByRole("link", { name: /Прайс-лист/ }).first()).toBeVisible();
  await expect(
    main.getByRole("link", { name: "Как ухаживать за мебелью из массива" }).first(),
  ).toBeVisible();
  await expect(main.getByRole("link", { name: "+7 (900) 000-00-00" }).first()).toBeVisible();
  // Правки на сайте в каталоге нет.
  await expect(page.getByRole("button", { name: "Править на сайте" })).toHaveCount(0);
});

test("каталог блоков — только после входа", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await context.newPage();
  await page.goto("/_blocks");
  await expect(page).toHaveURL(/\/login\?next=%2F_blocks/);
  await context.close();
});
