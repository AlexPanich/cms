import { expect, test } from "@playwright/test";

// В E2E пользователи уже есть, поэтому /setup закрыт. Сам первый запуск проверяет
// интеграционный тест src/server/setup/service.test.ts.
test("после первого запуска /setup ведёт на вход", async ({ browser }) => {
  const guest = await browser.newPage({ storageState: { cookies: [], origins: [] } });
  await guest.goto("/setup");
  await expect(guest).toHaveURL(/\/login$/);
  await expect(guest.getByRole("button", { name: "Войти" })).toBeVisible();
  await guest.close();
});
