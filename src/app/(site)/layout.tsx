import type { Viewport } from "next";
import { connection } from "next/server";
import { FrontEditProvider } from "@/components/site/front-edit-lazy";
import { cachedSiteMenu } from "@/server/site/cached";
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
  const [editor, info, mainMenu, footerMenu] = await Promise.all([
    getFrontEditor(),
    getSiteInfo(),
    cachedSiteMenu("main"),
    cachedSiteMenu("footer"),
  ]);
  const site = (
    <theme.SiteLayout site={info} mainMenu={mainMenu} footerMenu={footerMenu}>
      {children}
    </theme.SiteLayout>
  );
  return editor ? (
    <FrontEditProvider canOpenAdmin={editor.canOpenAdmin}>{site}</FrontEditProvider>
  ) : (
    site
  );
}
