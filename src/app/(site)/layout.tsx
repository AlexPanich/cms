import type { Viewport } from "next";
import { connection } from "next/server";
import { FrontEditProvider } from "./_components/front-edit-lazy";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { getFrontEditor } from "./_lib/data";

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
  const editor = await getFrontEditor();
  const site = (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#content"
        className="bg-background sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        К содержимому
      </a>
      <header className="border-b">
        <SiteHeader />
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {children}
      </main>
      <footer className="border-t">
        <SiteFooter />
      </footer>
    </div>
  );
  return editor ? (
    <FrontEditProvider canOpenAdmin={editor.canOpenAdmin}>{site}</FrontEditProvider>
  ) : (
    site
  );
}
