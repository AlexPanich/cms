import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { expectToast, insertPublishedPage, resetSiteCache, setSiteSettings } from "./fixtures";

test("настройки сайта: контакты из админки в подвале и блоке «Контакты», правка на сайте", async ({
  page,
}) => {
  const stamp = Date.now();
  const slug = `e2e-kontakty-${stamp}`;
  await insertPublishedPage({
    slug,
    title: `E2E Контакты ${stamp}`,
    blocks: [{ type: "contacts", data: { title: "Как нас найти", showSocials: true } }],
  });
  // Настройки общие для сайта: тест начинает с пустых и возвращает прежние.
  const previous = await setSiteSettings({});
  await resetSiteCache(page);

  try {
    await page.goto("/admin/settings");
    await expect(page.getByRole("heading", { name: "Настройки сайта" })).toBeVisible();
    await page.getByRole("textbox", { name: "Телефон" }).fill("звоните");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByText(/Телефон из цифр/)).toBeVisible();

    await page.getByRole("textbox", { name: "Телефон" }).fill("+7 (999) 123-45-67");
    await page.getByRole("textbox", { name: "Почта" }).fill("hello@example.test");
    await page.getByRole("textbox", { name: "Адрес", exact: true }).fill(`Москва, ${stamp}`);
    await page.getByRole("button", { name: "Добавить: соцсеть" }).click();
    await page.getByRole("combobox", { name: "Соцсеть" }).click();
    await page.getByRole("option", { name: "Telegram", exact: true }).click();
    await page.getByRole("textbox", { name: "Адрес страницы" }).fill("https://t.me/e2e");
    await page.getByLabel("Логотип").setInputFiles({
      name: "logo.png",
      mimeType: "image/png",
      buffer: await sharp({
        create: { width: 64, height: 32, channels: 3, background: "#0a0" },
      })
        .png()
        .toBuffer(),
    });
    await expect(page.getByRole("button", { name: "Заменить" })).toBeVisible();
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expectToast(page, "Настройки сохранены");

    // Кеш сайта сброшен действием: контакты видны и в блоке, и в подвале.
    await page.goto(`/${slug}`);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Как нас найти" })).toBeVisible();
    await expect(main.getByRole("link", { name: "+7 (999) 123-45-67" })).toHaveAttribute(
      "href",
      "tel:+79991234567",
    );
    await expect(main.getByRole("link", { name: "hello@example.test" })).toHaveAttribute(
      "href",
      "mailto:hello@example.test",
    );
    await expect(main.getByText(`Москва, ${stamp}`)).toBeVisible();
    await expect(main.getByRole("link", { name: "Telegram" })).toHaveAttribute(
      "href",
      "https://t.me/e2e",
    );
    await expect(page.getByRole("banner").locator("img")).toHaveAttribute("src", /\.webp/);
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: "+7 (999) 123-45-67" })).toBeVisible();

    // На сайте правятся только контакты, остальные настройки остаются.
    await page.getByRole("button", { name: "Править на сайте" }).click();
    await main.getByRole("button", { name: "Изменить: контакты" }).click();
    const dialog = page.getByRole("dialog", { name: "Настройки сайта: контакты" });
    await dialog.getByRole("textbox", { name: "Телефон" }).fill("8 800 555-35-35");
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expectToast(page, "Настройки сохранены");
    await expect(dialog).toBeHidden();

    await page.reload();
    await expect(main.getByRole("link", { name: "8 800 555-35-35" })).toHaveAttribute(
      "href",
      "tel:88005553535",
    );
    await expect(footer.getByRole("link", { name: "8 800 555-35-35" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Telegram" })).toBeVisible();
  } finally {
    await setSiteSettings(previous);
    await resetSiteCache(page);
  }
});
