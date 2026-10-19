import { expect, test } from "@playwright/test";
import { expectToast, insertMenu, insertRootPages } from "./fixtures";

test("пункты меню: страница, ссылка, правка и удаление", async ({ page }) => {
  const stamp = Date.now();
  const pageSlug = `e2e-menu-page-${stamp}`;
  const link = `e2e-ссылка-${stamp}`;
  await insertRootPages([pageSlug]);
  const menuId = await insertMenu(`e2e-menu-${stamp}`);

  await page.goto("/admin/menus");
  await page.getByRole("link", { name: `e2e-menu-${stamp}` }).click();
  await expect(page.getByText("В меню пока нет пунктов")).toBeVisible();

  // Пункт на страницу: название берётся из страницы.
  await page.getByRole("link", { name: "Добавить пункт" }).click();
  await page.getByRole("button", { name: "Добавить пункт" }).click();
  await expect(page.getByText("Выберите страницу", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Страница" }).click();
  await page.getByRole("option", { name: pageSlug }).click();
  await page.getByRole("button", { name: "Добавить пункт" }).click();
  await expectToast(page, "Пункт добавлен");
  await expect(page).toHaveURL(new RegExp(`/admin/menus/${menuId}$`));
  await expect(page.getByRole("link", { name: pageSlug })).toBeVisible();
  await expect(page.getByText(`/${pageSlug}`, { exact: true })).toBeVisible();

  // Ссылка: опасный протокол отклоняется.
  await page.getByRole("link", { name: "Добавить пункт" }).click();
  await page.getByRole("combobox", { name: "Куда ведёт" }).click();
  await page.getByRole("option", { name: "Произвольная ссылка" }).click();
  await page.getByRole("textbox", { name: "Адрес ссылки" }).fill("javascript:alert(1)");
  await page.getByRole("textbox", { name: "Название" }).fill(link);
  await page.getByRole("button", { name: "Добавить пункт" }).click();
  await expect(page.getByText("Ссылка должна начинаться с «/»", { exact: false })).toBeVisible();
  await page.getByRole("textbox", { name: "Адрес ссылки" }).fill("/contacts");
  await page.getByRole("button", { name: "Добавить пункт" }).click();
  await expectToast(page, "Пункт добавлен");
  await expect(page.getByRole("link", { name: link })).toBeVisible();

  // Правка названия.
  await page.getByRole("link", { name: link }).click();
  await expect(page.getByRole("textbox", { name: "Адрес ссылки" })).toHaveValue("/contacts");
  await page.getByRole("textbox", { name: "Название" }).fill(`${link}-2`);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Пункт сохранён");
  await expect(page.getByRole("link", { name: `${link}-2` })).toBeVisible();

  // Удаление.
  await page.getByRole("button", { name: `Удалить «${link}-2»` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Пункт удалён");
  await expect(page.getByRole("link", { name: `${link}-2` })).toHaveCount(0);
  await expect(page.getByRole("link", { name: pageSlug })).toBeVisible();
});

test("порядок пунктов меню меняется перетаскиванием с клавиатуры", async ({ page }) => {
  const stamp = Date.now();
  const [a, b, c] = ["a", "b", "c"].map((letter) => `e2e-item-${stamp}-${letter}`);
  const menuId = await insertMenu(`e2e-menu-${stamp}`, [a, b, c]);

  await page.goto(`/admin/menus/${menuId}`);
  const over = (target: string) => page.getByText(`Пункт «${c}» над позицией «${target}».`);

  // Как в тесте дерева страниц: KeyboardSensor может пропустить первое нажатие.
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
  const links = page.getByRole("link").filter({ hasText: `e2e-item-${stamp}` });
  await expect(links).toHaveCount(3);
  expect(await links.allTextContents()).toEqual([c, a, b]);
});
