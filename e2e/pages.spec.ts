import { expect, test } from "@playwright/test";
import { expectToast, insertRootPages } from "./fixtures";

test("страница с текстом, подстраница и пересчёт адресов при смене slug", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Раздел ${stamp}`;
  const slug = `e2e-razdel-${stamp}`;

  await page.goto("/admin/pages/new");
  await page.getByLabel("Заголовок", { exact: true }).fill(title);
  await page.getByLabel("Заголовок", { exact: true }).blur();
  await expect(page.getByLabel("Адрес (slug)")).toHaveValue(slug);

  const editor = page.getByRole("textbox", { name: "Содержимое" });
  await editor.click();
  await editor.pressSequentially("Первый абзац ");
  await page.getByRole("button", { name: "Жирный" }).click();
  await editor.pressSequentially("жирно");
  await page.getByRole("checkbox", { name: "Опубликована" }).click();
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expectToast(page, "Страница создана");
  await expect(page).toHaveURL(/\/admin\/pages$/);

  await page.getByRole("link", { name: `Добавить подстраницу в «${title}»` }).click();
  await expect(page.getByRole("combobox", { name: "Родительская страница" })).toContainText(title);
  await page.getByLabel("Заголовок", { exact: true }).fill("Дочерняя");
  await page.getByLabel("Заголовок", { exact: true }).blur();
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expectToast(page, "Страница создана");
  await expect(page.getByText(`/${slug}/dochernyaya`)).toBeVisible();

  await page.getByRole("link", { name: title, exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Содержимое" })).toContainText("Первый абзац");
  await expect(page.getByRole("textbox", { name: "Содержимое" }).locator("strong")).toHaveText(
    "жирно",
  );

  await page.getByLabel("Адрес (slug)").fill(`${slug}-new`);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Страница сохранена");
  await expect(page.getByText(`/${slug}-new`, { exact: true })).toBeVisible();

  // Удалить страницу с потомками нельзя.
  await page.getByRole("button", { name: "Удалить" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("есть вложенные страницы");
  await dialog.getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Сначала перенесите или удалите дочерние страницы");
  await page.keyboard.press("Escape");

  await page.goto("/admin/pages");
  await expect(page.getByText(`/${slug}-new/dochernyaya`)).toBeVisible();
});

test("порядок страниц меняется перетаскиванием с клавиатуры", async ({ page }) => {
  const stamp = Date.now();
  const [a, b, c] = ["a", "b", "c"].map((letter) => `e2e-sort-${stamp}-${letter}`);
  await insertRootPages([a, b, c]);

  await page.goto("/admin/pages");
  const over = (target: string) => page.getByText(`Страница «${c}» над позицией «${target}».`);

  // KeyboardSensor dnd-kit начинает слушать клавиши через setTimeout после захвата, и нажатие,
  // пришедшее раньше, теряется. Поэтому жмём стрелку снова, только пока строка не сдвинулась.
  const moveUp = (from: string, to: string) =>
    expect(async () => {
      if ((await over(from).count()) > 0) await page.keyboard.press("ArrowUp");
      await expect(over(to)).toBeAttached({ timeout: 300 });
    }).toPass({ timeout: 5_000 });

  await page.getByRole("button", { name: `Перетащить «${c}»` }).focus();
  await page.keyboard.press("Space");
  await expect(over(c)).toBeAttached();
  await moveUp(c, b);
  await moveUp(b, a);
  await page.keyboard.press("Space");
  await expectToast(page, "Порядок сохранён");

  await page.reload();
  const links = page.getByRole("link").filter({ hasText: `e2e-sort-${stamp}` });
  await expect(links).toHaveCount(3);
  const titles = await links.allTextContents();
  expect(titles).toEqual([c, a, b]);
});

test("форма страницы показывает ошибки клиента и сервера", async ({ page }) => {
  const stamp = Date.now();
  await insertRootPages([`e2e-taken-${stamp}`]);

  await page.goto("/admin/pages/new");
  await page.getByLabel("Заголовок", { exact: true }).fill("Ошибочная");
  await page.getByLabel("Адрес (slug)").fill("Плохой адрес");
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expect(page.getByText("Только латиница в нижнем регистре, цифры и дефисы")).toBeVisible();

  await page.getByLabel("Адрес (slug)").fill(`e2e-taken-${stamp}`);
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expect(
    page.locator("[data-slot=field-error]", {
      hasText: "Страница с таким адресом уже существует",
    }),
  ).toBeVisible();
});
