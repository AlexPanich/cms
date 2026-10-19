import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { AUTH_FILE } from "./e2e/fixtures";

// Origin должен совпадать с BETTER_AUTH_URL, иначе Better Auth отклонит вход.
const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Тесты работают с общей БД и общим rate limit входа — запускаем последовательно.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    locale: "ru-RU",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/, teardown: "teardown" },
    { name: "teardown", testMatch: /global\.teardown\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_FILE },
      dependencies: ["setup"],
    },
  ],
  // Нужна свежая сборка: pnpm build. В CI сборка идёт отдельным шагом до E2E.
  webServer: {
    command: "pnpm start",
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
