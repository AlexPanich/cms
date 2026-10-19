import type { Viewport } from "next";
import { connection } from "next/server";
import { cachedSiteMenu } from "@/server/site/cached";
import { loadSiteContext } from "@/server/site/content";
import { theme } from "@/theme";
import { getSiteInfo } from "../(site)/_lib/data";

// Каталог блоков рисуется в оболочке темы (шапка, подвал, шрифты), как страница сайта, но без
// правки на сайте: нет FrontEditProvider, и обёртки Editable… выводят только содержимое.
// Рендер блокирующий, как у публичного сайта (src/app/(site)/layout.tsx).
export const instant = false;

export async function generateViewport(): Promise<Viewport> {
  await connection();
  return {};
}

export default async function CatalogLayout({ children }: LayoutProps<"/">) {
  await connection();
  const [info, mainMenu, footerMenu, context] = await Promise.all([
    getSiteInfo(),
    cachedSiteMenu("main"),
    cachedSiteMenu("footer"),
    loadSiteContext(),
  ]);
  return (
    <div data-site className="contents">
      <theme.SiteLayout site={info} mainMenu={mainMenu} footerMenu={footerMenu} context={context}>
        {children}
      </theme.SiteLayout>
    </div>
  );
}
