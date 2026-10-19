import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test } from "@playwright/test";
import { BLOCKS } from "../src/lib/blocks/registry";

// Скриншоты темы для сравнения с макетом: каждый блок каталога /_blocks отдельно и основные
// страницы целиком, на широком экране и на телефоне. Не проверка, а материал для глаз —
// запускается только через pnpm theme:screenshots (каталог задаёт SCREENSHOTS_DIR).
const dir = process.env.SCREENSHOTS_DIR;

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const PAGES = [
  { name: "home", url: "/" },
  { name: "articles", url: "/articles" },
  { name: "search", url: "/search?q=сайт" },
  { name: "not-found", url: "/e2e-net-takoy-stranicy" },
];

test.skip(!dir, "только для pnpm theme:screenshots");

for (const viewport of VIEWPORTS) {
  test(`скриншоты темы: ${viewport.name}`, async ({ page }) => {
    const out = path.resolve(dir!, viewport.name);
    await mkdir(out, { recursive: true });
    await page.setViewportSize(viewport);

    await page.goto("/_blocks");
    await page.getByRole("heading", { level: 1, name: "Каталог блоков" }).waitFor();
    for (const block of BLOCKS) {
      await page
        .getByRole("region", { name: new RegExp(`^${block.label}`) })
        .screenshot({ path: path.join(out, `block-${block.type}.png`) });
    }

    for (const item of PAGES) {
      await page.goto(item.url);
      await page.getByRole("heading", { level: 1 }).first().waitFor();
      await page.screenshot({ path: path.join(out, `page-${item.name}.png`), fullPage: true });
    }
  });
}
