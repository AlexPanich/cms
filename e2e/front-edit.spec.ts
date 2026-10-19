import { expect, test } from "@playwright/test";
import { expectToast, insertPublishedPage, resetSiteCache, setTextBody } from "./fixtures";

test("правка на сайте: заголовок, текст страницы и текст в подвале", async ({ page }) => {
  const stamp = Date.now();
  const slug = `e2e-front-${stamp}`;
  await insertPublishedPage({ slug, title: `E2E Правка ${stamp}`, paragraphs: ["Старый абзац"] });
  const footer = await setTextBody("footer", `E2E подвал ${stamp}`);
  await resetSiteCache(page);

  try {
    await page.goto(`/${slug}`);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText(`E2E Правка ${stamp}`);

    // Кнопки правки появляются только в режиме правки.
    await expect(page.getByRole("button", { name: "Изменить заголовок" })).toHaveCount(0);
    const toggle = page.getByRole("button", { name: "Править на сайте" });
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Изменить заголовок" }).click();
    await page.getByRole("textbox", { name: "Заголовок страницы" }).fill("   ");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText("Укажите заголовок")).toBeVisible();
    await page.getByRole("textbox", { name: "Заголовок страницы" }).fill(`E2E Новый ${stamp}`);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expectToast(page, "Заголовок сохранён");
    await expect(heading).toHaveText(`E2E Новый ${stamp}`);

    await page.getByRole("button", { name: "Изменить текст страницы" }).click();
    const editor = page.getByRole("textbox", { name: "Текст страницы" });
    await editor.click();
    await editor.press("ControlOrMeta+a");
    await editor.pressSequentially("Новый абзац");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expectToast(page, "Текст страницы сохранён");
    await expect(page.getByText("Новый абзац", { exact: true })).toBeVisible();
    await expect(page.getByText("Старый абзац")).toHaveCount(0);

    // Отмена ничего не сохраняет.
    await page.getByRole("button", { name: "Изменить: текст в подвале" }).click();
    await page.getByRole("textbox", { name: "Текст в подвале" }).fill("Не сохранять");
    await page.getByRole("button", { name: "Отмена" }).click();
    await expect(page.getByText(`E2E подвал ${stamp}`)).toBeVisible();

    await page.getByRole("button", { name: "Изменить: текст в подвале" }).click();
    await page.getByRole("textbox", { name: "Текст в подвале" }).fill(`E2E новый подвал ${stamp}`);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expectToast(page, "Текст сохранён");

    // Сохранено в БД и видно после перезагрузки (кеш сайта сброшен действием).
    await page.reload();
    await expect(heading).toHaveText(`E2E Новый ${stamp}`);
    await expect(page.getByText("Новый абзац", { exact: true })).toBeVisible();
    await expect(page.getByText(`E2E новый подвал ${stamp}`)).toBeVisible();
  } finally {
    await setTextBody("footer", footer);
    await resetSiteCache(page);
  }
});

test("гость не видит правки на сайте", async ({ page, browser }) => {
  const stamp = Date.now();
  const slug = `e2e-front-guest-${stamp}`;
  await insertPublishedPage({ slug, title: `E2E Гость ${stamp}` });

  await resetSiteCache(page);

  const guest = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await guest.goto(`/${slug}`);
  await expect(guest.getByRole("heading", { level: 1 })).toHaveText(`E2E Гость ${stamp}`);
  await expect(guest.getByRole("complementary", { name: "Правка на сайте" })).toHaveCount(0);
  await expect(guest.getByRole("button", { name: "Править на сайте" })).toHaveCount(0);
  await guest.close();
});
