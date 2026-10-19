import type { Viewport } from "next";
import { connection } from "next/server";
import { FrontEditProvider } from "@/components/site/front-edit-lazy";
import { cachedSiteMenu } from "@/server/site/cached";
import { loadSiteContext } from "@/server/site/content";
import { getFrontEditor } from "@/server/site/front-editor";
import { theme } from "@/theme";
import { getSiteInfo } from "./_lib/data";

// Публичный сайт рендерится целиком до отправки ответа, без стриминга и без <Suspense>
// (подробно — в CLAUDE.md): метаданные попадают в <head>, а текст — сразу в HTML, а не
// в скрытый блок, который потом вставляет скрипт. Статусы 404 и 308 отдаёт proxy.
export const instant = false;

// Viewport нельзя стримить: если он зависит от запроса, Next не отдаёт заранее собранную
// оболочку и ждёт рендера всей страницы. Это и включает блокирующий рендер публичной части.
export async function generateViewport(): Promise<Viewport> {
  await connection();
  return {};
}

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  await connection();
  const [editor, info, mainMenu, footerMenu, context] = await Promise.all([
    getFrontEditor(),
    getSiteInfo(),
    cachedSiteMenu("main"),
    cachedSiteMenu("footer"),
    loadSiteContext(),
  ]);
  // data-site — граница стилей темы (src/theme/theme.css). Обёртка не создаёт блока
  // (display: contents), поэтому вёрстку оболочки целиком задаёт тема. Окна и уведомления
  // правки на сайте выводятся в портал вне неё и выглядят как админка.
  const site = (
    <div data-site className="contents">
      <theme.SiteLayout site={info} mainMenu={mainMenu} footerMenu={footerMenu} context={context}>
        {children}
      </theme.SiteLayout>
    </div>
  );
  return editor ? (
    <FrontEditProvider canOpenAdmin={editor.canOpenAdmin}>{site}</FrontEditProvider>
  ) : (
    site
  );
}
