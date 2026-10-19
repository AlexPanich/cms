import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { expectToast } from "./fixtures";

const png = (background: string) =>
  sharp({ create: { width: 64, height: 48, channels: 3, background } })
    .png()
    .toBuffer();

test("галерея: загрузка нескольких файлов, порядок, описание, удаление", async ({ page }) => {
  const stamp = Date.now();
  const title = `E2E Галерея ${stamp}`;
  const [a, b, c] = ["a", "b", "c"].map((letter) => `e2e-${stamp}-${letter}.png`);

  await page.goto("/admin/galleries/new");
  await page.getByRole("textbox", { name: "Название" }).fill(title);
  await page.getByRole("textbox", { name: "Название" }).blur();
  await expect(page.getByRole("textbox", { name: "Ключ" })).toHaveValue(`e2e-galereya-${stamp}`);
  await page.getByRole("button", { name: "Создать галерею" }).click();
  await expectToast(page, "Галерея создана");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("В галерее пока нет изображений")).toBeVisible();

  // Несколько файлов за раз; негодный файл отклоняется, остальные загружаются.
  await page.getByLabel("Файлы изображений").setInputFiles([
    { name: a, mimeType: "image/png", buffer: await png("#f00") },
    { name: "e2e-shell.php.png", mimeType: "image/png", buffer: Buffer.from("<?php ?>") },
    { name: b, mimeType: "image/png", buffer: await png("#0f0") },
    { name: c, mimeType: "image/png", buffer: await png("#00f") },
  ]);
  await expectToast(
    page,
    "e2e-shell.php.png: Не удалось прочитать изображение. Подходят JPEG, PNG, WebP, GIF и AVIF",
  );
  await expectToast(page, "Загружено 3 из 4");
  const handles = page.getByRole("button", { name: /^Перетащить/ });
  await expect(handles).toHaveCount(3);

  // Порядок с клавиатуры: c ставится первым.
  const over = (target: string) => page.getByText(`Изображение «${c}» над позицией «${target}».`);
  const moveLeft = (from: string, to: string) =>
    expect(async () => {
      if ((await over(from).count()) > 0) await page.keyboard.press("ArrowLeft");
      await expect(over(to)).toBeAttached({ timeout: 300 });
    }).toPass({ timeout: 5_000 });
  await page.getByRole("button", { name: `Перетащить «${c}»` }).focus();
  await page.keyboard.press("Space");
  await expect(over(c)).toBeAttached();
  await moveLeft(c, b);
  await moveLeft(b, a);
  await page.keyboard.press("Space");
  await expectToast(page, "Порядок сохранён");

  await page.reload();
  await expect(handles).toHaveCount(3);
  expect(await handles.evaluateAll((items) => items.map((item) => item.ariaLabel))).toEqual(
    [c, a, b].map((name) => `Перетащить «${name}»`),
  );

  // Описание картинки становится её alt.
  await page.getByRole("button", { name: `Описание «${a}»` }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: "Описание" }).fill("Красный");
  await page.getByRole("dialog").getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Описание сохранено");
  await expect(page.getByRole("img", { name: "Красный" })).toBeVisible();

  // Убранная картинка нигде больше не используется — она удаляется совсем.
  await page.getByRole("button", { name: `Убрать «${b}»` }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Убрать" }).click();
  await expectToast(page, "Изображение убрано");
  await expect(handles).toHaveCount(2);

  await page.goto(`/admin/media?q=e2e-${stamp}`);
  await expect(page.getByText(c, { exact: true })).toBeVisible();
  await expect(page.getByText(a, { exact: true })).toBeVisible();
  await expect(page.getByText(b, { exact: true })).toHaveCount(0);
  await expect(page.getByText("галерей: 1")).toHaveCount(2);

  // Удаление галереи удаляет и её картинки.
  await page.goto("/admin/galleries");
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Галерея удалена");
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
  await page.goto(`/admin/media?q=e2e-${stamp}`);
  await expect(page.getByText("Ничего не нашлось")).toBeVisible();
});
