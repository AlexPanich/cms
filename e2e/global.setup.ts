import { execFileSync } from "node:child_process";
import { expect, test as setup } from "@playwright/test";
import { ADMIN, AUTH_FILE, cleanupE2EData, login, PASSWORD } from "./fixtures";

setup("администратор входит через форму входа", async ({ page }) => {
  await cleanupE2EData();
  execFileSync("pnpm", ["-s", "user:create-admin", "--email", ADMIN.email, "--name", ADMIN.name], {
    env: { ...process.env, ADMIN_PASSWORD: PASSWORD },
    stdio: "inherit",
  });

  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fusers$/);

  await login(page, ADMIN.email, "wrong-password-1");
  await expect(page.getByText("Неверный email или пароль")).toBeVisible();

  await login(page, ADMIN.email);
  await expect(page).toHaveURL(/\/admin\/users$/);
  await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
