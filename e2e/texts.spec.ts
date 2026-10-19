import { expect, test } from "@playwright/test";
import { expectToast } from "./fixtures";

test("текст: создание с ключом из названия, поиск, правка и удаление", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Телефон ${stamp}`;
  const key = `e2e-telefon-${stamp}`;

  await page.goto("/admin/texts/new");
  await page.getByRole("textbox", { name: "Название" }).fill(title);
  await page.getByRole("textbox", { name: "Название" }).blur();
  await expect(page.getByRole("textbox", { name: "Ключ" })).toHaveValue(key);
  await page.getByRole("textbox", { name: "Текст" }).fill("+7 900 000-00-00\nс 9 до 18");
  await page.getByRole("button", { name: "Создать текст" }).click();
  await expectToast(page, "Текст создан");
  await expect(page).toHaveURL(/\/admin\/texts$/);

  await page.getByRole("searchbox").fill(key);
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // Ключ занят — ошибка у поля.
  await page.goto("/admin/texts/new");
  // Ключ подставляется из названия при потере фокуса — даём этому случиться до ввода ключа.
  await page.getByRole("textbox", { name: "Название" }).fill("Дубль");
  await page.getByRole("textbox", { name: "Название" }).blur();
  await expect(page.getByRole("textbox", { name: "Ключ" })).toHaveValue("dubl");
  await page.getByRole("textbox", { name: "Ключ" }).fill(key);
  await page.getByRole("button", { name: "Создать текст" }).click();
  await expect(
    page.locator("[data-slot=field-error]", { hasText: "Текст с таким ключом уже существует" }),
  ).toBeVisible();

  await page.goto(`/admin/texts?q=${key}`);
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("textbox", { name: "Текст" })).toHaveValue(
    "+7 900 000-00-00\nс 9 до 18",
  );
  await page.getByRole("checkbox", { name: "Показывать на сайте" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Текст сохранён");

  await page.goto(`/admin/texts?q=${key}`);
  await expect(page.getByText("скрыт", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Текст удалён");
  await expect(page).toHaveURL(/\/admin\/texts$/);
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
});
