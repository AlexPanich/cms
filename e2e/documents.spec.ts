import { expect, test } from "@playwright/test";
import { expectToast } from "./fixtures";

test("документ: проверка файла, скачивание, правка и удаление", async ({ page, request }) => {
  const stamp = Date.now();
  const fileName = `e2e-Прайс ${stamp}.pdf`;
  const title = `e2e-Прайс ${stamp}`;

  await page.goto("/admin/documents/new");
  await page.getByRole("button", { name: "Загрузить документ" }).click();
  await expect(page.getByText("Выберите файл", { exact: true })).toBeVisible();

  // Расширение не из белого списка отсекается ещё в браузере.
  const fileInput = page.getByLabel("Файл");
  await fileInput.setInputFiles({
    name: "shell.php",
    mimeType: "application/pdf",
    buffer: Buffer.from("<?php system($_GET['c']); ?>"),
  });
  await expect(page.getByText("Такой тип файла не поддерживается", { exact: true })).toBeVisible();

  // Подходящее расширение, но содержимое не PDF — отказ сервера.
  await fileInput.setInputFiles({
    name: "shell.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("<?php system($_GET['c']); ?>"),
  });
  await page.getByRole("textbox", { name: "Название" }).fill(title);
  await page.getByRole("button", { name: "Загрузить документ" }).click();
  // Ошибка сервера показывается у поля «Файл» (и уведомлением).
  await expect(
    page.getByRole("main").getByText("Содержимое файла не похоже на .pdf", { exact: true }),
  ).toBeVisible();

  await fileInput.setInputFiles({
    name: fileName,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7\n%e2e"),
  });
  await expect(page.getByText(fileName, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Загрузить документ" }).click();
  await expectToast(page, "Документ загружен");
  await expect(page).toHaveURL(/\/admin\/documents$/);

  // Файл отдаётся как вложение под исходным именем, с MIME из белого списка.
  const href = await page.getByRole("link", { name: `Скачать «${title}»` }).getAttribute("href");
  expect(href).toMatch(/^\/media\/documents\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.pdf$/);
  const response = await request.get(href ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("application/pdf");
  expect(response.headers()["content-disposition"]).toBe(
    `attachment; filename="e2e-_____ ${stamp}.pdf"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
  );
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await response.text()).toBe("%PDF-1.7\n%e2e");
  // Ключ, которого нет в базе, и ключ с другим расширением не отдаются.
  for (const path of [
    href?.replace(/[0-9a-f]{12}\.pdf$/, "000000000000.pdf"),
    href?.replace(".pdf", ".webp"),
    href?.replace("/documents/", "/images/"),
  ]) {
    expect((await request.get(path ?? "")).status(), path).toBe(404);
  }

  // Правка названия.
  await page.getByRole("link", { name: title, exact: true }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByRole("textbox", { name: "Название" }).fill(`${title} (новый)`);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Документ сохранён");
  await expect(page.getByRole("heading", { name: `${title} (новый)` })).toBeVisible();

  await page.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Документ удалён");
  await expect(page.getByRole("link", { name: `${title} (новый)` })).toHaveCount(0);
  expect((await request.get(href ?? "")).status()).toBe(404);
});
