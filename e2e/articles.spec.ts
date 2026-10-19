import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { expectToast } from "./fixtures";

const png = (background: string) =>
  sharp({ create: { width: 64, height: 48, channels: 3, background } })
    .png()
    .toBuffer();

test("статья с превью: загрузка, замена, публикация и удаление", async ({ page, request }) => {
  const stamp = Date.now();
  const title = `E2E Новость ${stamp}`;
  const slug = `e2e-novost-${stamp}`;

  await page.goto("/admin/articles/new");
  await page.getByRole("textbox", { name: "Заголовок" }).fill(title);
  await page.getByRole("textbox", { name: "Заголовок" }).blur();
  await expect(page.getByRole("textbox", { name: "Адрес (slug)" })).toHaveValue(slug);
  await page.getByRole("textbox", { name: "Анонс" }).fill("Коротко о главном");

  // Слишком большой файл отсекается ещё в браузере.
  const fileInput = page.getByLabel("Превью");
  await fileInput.setInputFiles({
    name: "big.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expectToast(page, "Файл больше 10 МБ");

  // Не картинка — отказ сервера, превью не меняется.
  await fileInput.setInputFiles({
    name: "shell.php.png",
    mimeType: "image/png",
    buffer: Buffer.from("<?php system($_GET['c']); ?>"),
  });
  await expectToast(page, "Не удалось прочитать изображение. Подходят JPEG, PNG, WebP, GIF и AVIF");
  await expect(page.getByRole("img", { name: "Текущее изображение" })).toHaveCount(0);

  await fileInput.setInputFiles({
    name: "red.png",
    mimeType: "image/png",
    buffer: await png("#f00"),
  });
  const preview = page.getByRole("img", { name: "Текущее изображение" });
  await expect(preview).toBeVisible();
  await expect(page.getByRole("button", { name: "Заменить" })).toBeVisible();

  await page.getByRole("checkbox", { name: "Опубликована" }).click();
  await page.getByRole("button", { name: "Создать статью" }).click();
  await expectToast(page, "Статья создана");
  await expect(page).toHaveURL(/\/admin\/articles$/);

  await page.getByRole("link", { name: title }).click();
  await expect(page.getByText(/^Опубликована \d+/)).toBeVisible();

  // Картинка отдаётся обработчиком /media в WebP с защитными заголовками.
  const src = await page.getByRole("img", { name: "Текущее изображение" }).getAttribute("src");
  const mediaPath = new URL(src ?? "", page.url()).searchParams.get("url");
  expect(mediaPath).toMatch(/^\/media\/images\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);
  const response = await request.get(mediaPath ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/webp");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  for (const path of [
    "/media/images/2026/01/..%2f..%2f..%2fpackage.json",
    mediaPath?.replace(".webp", ".php"),
  ]) {
    expect((await request.get(path ?? "")).status(), path).toBe(404);
  }
  // «%2e%2e» нормализуется ещё до маршрутизации: запрос уходит в /package.json, то есть
  // в маршрут страниц сайта, и тот отвечает «не найдена». Главное — файл не отдаётся.
  const traversal = await request.get("/media/images/%2e%2e/%2e%2e/package.json");
  expect(traversal.headers()["content-type"]).toMatch(/^text\/html/);
  expect(await traversal.text()).not.toContain('"name": "cms"');

  // Замена превью и затем удаление превью.
  await page.getByLabel("Превью").setInputFiles({
    name: "blue.png",
    mimeType: "image/png",
    buffer: await png("#00f"),
  });
  await expect
    .poll(() => page.getByRole("img", { name: "Текущее изображение" }).getAttribute("src"))
    .not.toBe(src);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Статья сохранена");

  await page.getByRole("button", { name: "Убрать" }).click();
  await expect(page.getByRole("img", { name: "Текущее изображение" })).toHaveCount(0);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Статья сохранена");
  await page.reload();
  await expect(page.getByRole("button", { name: "Загрузить" })).toBeVisible();

  await page.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Статья удалена");
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);
});
