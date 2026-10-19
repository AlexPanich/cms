import "dotenv/config";
import { rm } from "node:fs/promises";
import path from "node:path";
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

// Опубликованная страница с текстом из абзацев. parentPath — путь родителя, если страница вложенная.
export async function insertPublishedPage({
  slug,
  title,
  paragraphs = [],
  parentPath,
}: {
  slug: string;
  title: string;
  paragraphs?: string[];
  parentPath?: string;
}) {
  const content = {
    type: "doc",
    content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
  };
  const sql = connect();
  try {
    const [parent] = parentPath
      ? await sql`select id from pages where path = ${parentPath}`
      : [{ id: null }];
    const path = parentPath ? `${parentPath}/${slug}` : slug;
    await sql`
      insert into pages (parent_id, slug, path, title, content, published)
      values (${parent.id}, ${slug}, ${path}, ${title}, ${sql.json(content)}, true)`;
  } finally {
    await sql.end();
  }
}

// Пункт главного меню на страницу. Удаляется вместе со страницей.
export async function addToMainMenu(path: string) {
  const sql = connect();
  try {
    await sql`
      insert into menu_items (menu_id, page_id, sort)
      select menus.id, pages.id, 1000 from menus, pages
      where menus.key = 'main' and pages.path = ${path}`;
  } finally {
    await sql.end();
  }
}

// Данные, вставленные прямо в БД, сайт не увидит, пока не сброшен его кеш.
// Запрос идёт с сессией администратора из контекста страницы.
export async function resetSiteCache(page: Page) {
  const response = await page.request.post("/api/site-cache");
  expect(response.ok()).toBe(true);
}

// Отдельное меню для теста, чтобы не трогать «main» и «footer». Пункты — ссылки с названиями labels.
export async function insertMenu(key: string, labels: string[] = []): Promise<number> {
  const sql = connect();
  try {
    const [{ id }] = await sql`insert into menus (key, title) values (${key}, ${key}) returning id`;
    for (const [index, label] of labels.entries()) {
      await sql`insert into menu_items (menu_id, url, label, sort) values (${id}, ${"/"}, ${label}, ${index})`;
    }
    return id;
  } finally {
    await sql.end();
  }
}

// Меняет текст по ключу и возвращает прежний — чтобы тест мог вернуть общий текст сайта.
export async function setTextBody(key: string, body: string): Promise<string> {
  const sql = connect();
  try {
    const [previous] = await sql`select body from texts where key = ${key}`;
    await sql`update texts set body = ${body}, published = true where key = ${key}`;
    return previous.body;
  } finally {
    await sql.end();
  }
}

export async function cleanupE2EData() {
  const sql = connect();
  try {
    await sql`delete from menus where key like ${`${E2E_PREFIX}%`}`;
    await sql`delete from texts where key like ${`${E2E_PREFIX}%`}`;
    await sql`delete from articles where slug like ${`${E2E_PREFIX}%`}`;
    await sql`delete from galleries where key like ${`${E2E_PREFIX}%`}`;
    // Файлы, загруженные пользователями E2E, — до удаления самих пользователей.
    const files = await sql<{ storage_key: string }[]>`
      delete from media
      where uploaded_by in (select id from users where email like ${`${E2E_PREFIX}%`})
      returning storage_key`;
    const storageDir = path.resolve(process.env.STORAGE_DIR ?? "./storage");
    for (const { storage_key } of files) {
      await rm(path.join(storageDir, storage_key), { force: true });
    }
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
