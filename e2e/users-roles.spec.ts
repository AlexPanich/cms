import { expect, test } from "@playwright/test";
import { ADMIN, expectToast, login, PASSWORD, uniqueEmail } from "./fixtures";

test("роль и пользователь: создание, вход под новым пользователем, проверка прав", async ({
  page,
  browser,
}) => {
  const roleName = `E2E Автор ${Date.now()}`;
  await page.goto("/admin/roles/new");
  await page.getByLabel("Название").fill(roleName);
  await page.getByLabel("Название").blur();
  await expect(page.getByLabel("Ключ")).toHaveValue(/^e2e-avtor-\d+$/);
  await expect(page.getByRole("checkbox", { name: "Доступ в админку" })).toBeChecked();
  await page.getByRole("checkbox", { name: "Тексты" }).click();
  await page.getByRole("button", { name: "Создать роль" }).click();

  await expectToast(page, "Роль создана");
  await expect(page).toHaveURL(/\/admin\/roles$/);
  const roleRow = page.getByRole("row", { name: new RegExp(roleName) });
  await expect(roleRow).toContainText("Тексты");

  const email = uniqueEmail("author");
  await page.goto("/admin/users/new");
  await page.getByLabel("Имя").fill("E2E Автор");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("checkbox", { name: roleName }).click();
  await page.getByRole("button", { name: "Создать пользователя" }).click();

  await expectToast(page, "Пользователь создан");
  await page.getByRole("searchbox").fill(email);
  await page.getByRole("searchbox").press("Enter");
  await expect(page.getByRole("row", { name: new RegExp(email) })).toContainText(roleName);

  // Новый пользователь видит админку, но не раздел пользователей.
  // Контекст наследует настройки проекта, включая сессию администратора, — сбрасываем её.
  const authorContext = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const authorPage = await authorContext.newPage();
  await authorPage.goto("/login");
  await login(authorPage, email);
  await expect(authorPage.getByRole("heading", { name: "Здравствуйте, E2E Автор" })).toBeVisible();
  await expect(authorPage.getByRole("link", { name: "Пользователи" })).toHaveCount(0);
  await authorPage.goto("/admin/users");
  await expect(authorPage.getByRole("heading", { name: "Недостаточно прав" })).toBeVisible();
  await authorContext.close();
});

test("форма пользователя показывает ошибки клиента и сервера", async ({ page }) => {
  await page.goto("/admin/users/new");
  await page.getByRole("button", { name: "Создать пользователя" }).click();
  await expect(page.getByText("Укажите имя")).toBeVisible();
  await expect(page.getByText("Некорректный email")).toBeVisible();
  await expect(page.getByText("Пароль не короче 10 символов")).toBeVisible();

  await page.getByLabel("Имя").fill("Дубликат");
  await page.getByLabel("Email").fill(ADMIN.email.toUpperCase());
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Создать пользователя" }).click();
  // Ошибка с сервера попадает под поле email (и дублируется уведомлением).
  await expect(
    page.locator("[data-slot=field-error]", {
      hasText: "Пользователь с таким email уже существует",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/users\/new$/);
});

test("редактирование, смена пароля и удаление пользователя", async ({ page }) => {
  const email = uniqueEmail("edit");
  await page.goto("/admin/users/new");
  await page.getByLabel("Имя").fill("E2E Черновик");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(PASSWORD);
  await page.getByRole("button", { name: "Создать пользователя" }).click();
  await expectToast(page, "Пользователь создан");

  await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  await page.getByRole("link", { name: "E2E Черновик" }).click();

  await page.getByLabel("Имя").fill("E2E Чистовик");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expectToast(page, "Изменения сохранены");
  await expect(page.getByRole("heading", { name: "E2E Чистовик" })).toBeVisible();

  await page.getByLabel("Новый пароль").fill("another-password-1");
  await page.getByRole("button", { name: "Сменить пароль" }).click();
  await expectToast(page, "Пароль изменён, другие сеансы пользователя завершены");
  await expect(page.getByLabel("Новый пароль")).toHaveValue("");

  await page.getByRole("button", { name: "Удалить" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Удалить пользователя?");
  await dialog.getByRole("button", { name: "Удалить" }).click();
  await expectToast(page, "Пользователь удалён");
  await expect(page).toHaveURL(/\/admin\/users$/);

  await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
  await expect(page.getByText("Никого не нашлось")).toBeVisible();
});

test("системные данные защищены в интерфейсе", async ({ page }) => {
  await page.goto(`/admin/users?q=${encodeURIComponent(ADMIN.email)}`);
  await page.getByRole("link", { name: ADMIN.name }).click();
  await expect(page.getByRole("heading", { name: ADMIN.name })).toBeVisible();
  await expect(page.getByRole("button", { name: "Удалить" })).toHaveCount(0);

  await page.goto("/admin/roles");
  await page.getByRole("link", { name: "Администратор" }).click();
  await expect(page.getByLabel("Ключ")).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "Пользователи" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Удалить" })).toHaveCount(0);
});
