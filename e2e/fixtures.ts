import "dotenv/config";
import { expect, type Page } from "@playwright/test";
import postgres from "postgres";

// Всё, что создают E2E-тесты, помечено этим префиксом и удаляется в teardown.
export const E2E_PREFIX = "e2e-";
export const AUTH_FILE = "e2e/.auth/admin.json";
export const PASSWORD = "e2e-password-123";
export const ADMIN = { name: "E2E Админ", email: "e2e-admin@example.test" };

function connect() {
  return postgres(process.env.DATABASE_URL ?? "", { max: 1 });
}

// Быстрое создание корневых страниц в обход интерфейса — для тестов, где форма не важна.
export async function insertRootPages(slugs: string[]) {
  const sql = connect();
  try {
    const [{ base }] =
      await sql`select coalesce(max(sort) + 1, 0) as base from pages where parent_id is null`;
    for (const [index, slug] of slugs.entries()) {
      await sql`insert into pages (slug, path, title, sort) values (${slug}, ${slug}, ${slug}, ${base + index})`;
    }
  } finally {
    await sql.end();
  }
}

export async function cleanupE2EData() {
  const sql = connect();
  try {
    // Один DELETE удаляет ветку целиком: внешний ключ parent_id проверяется в конце запроса.
    await sql`delete from pages where path like ${`${E2E_PREFIX}%`}`;
    await sql`delete from users where email like ${`${E2E_PREFIX}%`}`;
    await sql`delete from roles where key like ${`${E2E_PREFIX}%`}`;
  } finally {
    await sql.end();
  }
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
}

// Уникальный email, чтобы тесты не зависели друг от друга.
export function uniqueEmail(label: string) {
  return `${E2E_PREFIX}${label}-${Date.now()}@example.test`;
}

export async function expectToast(page: Page, text: string) {
  await expect(page.getByText(text, { exact: true })).toBeVisible();
}
