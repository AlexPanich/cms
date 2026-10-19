import { expect, test } from "@playwright/test";
import { expectToast, insertRootPages } from "./fixtures";

test("страница с текстом, подстраница и пересчёт адресов при смене slug", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Раздел ${stamp}`;
  const slug = `e2e-razdel-${stamp}`;
  // Уникальное имя: при повторе теста подстраница от прошлой попытки ещё в базе.
  const child = `Дочерняя ${stamp}`;
  const childSlug = `dochernyaya-${stamp}`;

  await page.goto("/admin/pages/new");
  await page.getByLabel("Заголовок", { exact: true }).fill(title);
  await page.getByLabel("Заголовок", { exact: true }).blur();
  await expect(page.getByLabel("Адрес (slug)")).toHaveValue(slug);

  await page.getByRole("button", { name: "Добавить блок" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^Текст/ })
    .click();
  const editor = page.getByRole("textbox", { name: "Текст" });
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
  await page.getByLabel("Заголовок", { exact: true }).fill(child);
  await page.getByLabel("Заголовок", { exact: true }).blur();
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expectToast(page, "Страница создана");
  await expect(page.getByText(`/${slug}/${childSlug}`)).toBeVisible();

  await page.getByRole("link", { name: title, exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Текст" })).toContainText("Первый абзац");
  await expect(page.getByRole("textbox", { name: "Текст" }).locator("strong")).toHaveText("жирно");

  await page.getByLabel("Адрес (slug)").fill(`${slug}-new`);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Страница сохранена");
  await expect(page.getByText(`/${slug}-new`, { exact: true })).toBeVisible();

  // Удалить страницу с потомками нельзя.
  await page.getByRole("button", { name: "Удалить", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("есть вложенные страницы");
  await dialog.getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Сначала перенесите или удалите дочерние страницы");
  await page.keyboard.press("Escape");

  await page.goto("/admin/pages");
  await expect(page.getByText(`/${slug}-new/${childSlug}`)).toBeVisible();

  // Опубликованная страница видна на сайте по новому адресу, старый адрес — 404.
  await page.goto(`/${slug}-new`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.locator("strong", { hasText: "жирно" })).toBeVisible();
  expect((await page.request.get(`/${slug}`)).status()).toBe(404);

  // Подстраница создана черновиком: на сайте её нет, пока не опубликуют.
  expect((await page.request.get(`/${slug}-new/${childSlug}`)).status()).toBe(404);
  await page.goto("/admin/pages");
  await page.getByRole("link", { name: child, exact: true }).click();
  await page.getByRole("checkbox", { name: "Опубликована" }).click();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Страница сохранена");
  await page.goto(`/${slug}-new/${childSlug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(child);
});

test("блоки страницы: добавление, проверка, порядок и сворачивание", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Блоки ${stamp}`;
  const slug = `e2e-bloki-${stamp}`;

  await page.goto("/admin/pages/new");
  await page.getByLabel("Заголовок", { exact: true }).fill(title);
  await page.getByLabel("Заголовок", { exact: true }).blur();
  await page.getByRole("checkbox", { name: "Опубликована" }).click();

  const addText = async () => {
    await page.getByRole("button", { name: "Добавить блок" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^Текст/ })
      .click();
  };
  const editors = page.getByRole("textbox", { name: "Текст" });
  for (const [index, text] of ["Первый блок", "Второй блок"].entries()) {
    await addText();
    await editors.nth(index).click();
    await editors.nth(index).pressSequentially(text);
  }

  // Пустой обязательный текст не сохраняется, блок помечен.
  await addText();
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expect(page.getByText("Обязательное поле")).toBeVisible();
  await expect(page.getByText("Нужно исправить")).toBeVisible();
  await page.getByRole("button", { name: "Удалить блок «Текст» (3)" }).click();
  await expect(editors).toHaveCount(2);

  // Второй блок ставится первым с клавиатуры (см. тест порядка страниц ниже).
  const over = (target: number) =>
    page.getByText(`Блок «Текст» (2) над позицией «Текст» (${target}).`);
  await page.getByRole("button", { name: "Перетащить блок «Текст» (2)" }).focus();
  await page.keyboard.press("Space");
  await expect(over(2)).toBeAttached();
  await expect(async () => {
    if ((await over(2).count()) > 0) await page.keyboard.press("ArrowUp");
    await expect(over(1)).toBeAttached({ timeout: 300 });
  }).toPass({ timeout: 5_000 });
  await page.keyboard.press("Space");
  await expect(editors.first()).toHaveText("Второй блок");

  // Свёрнутый блок показывает начало текста.
  await page.getByRole("button", { name: "Свернуть все" }).click();
  await expect(editors.first()).toBeHidden();
  await expect(page.getByRole("button", { name: /Текст Второй блок/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  await page.getByRole("button", { name: "Создать страницу" }).click();
  await expectToast(page, "Страница создана");

  await page.goto(`/${slug}`);
  const main = page.getByRole("main");
  await expect(main).toContainText("Первый блок");
  const text = await main.innerText();
  expect(text.indexOf("Второй блок")).toBeLessThan(text.indexOf("Первый блок"));
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
