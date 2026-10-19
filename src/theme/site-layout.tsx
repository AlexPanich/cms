import type { SiteLayoutProps } from "@/components/site/theme";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteLayout({ site, mainMenu, footerMenu, children }: SiteLayoutProps) {
  return (
    <div className="bg-background text-foreground flex min-h-full flex-1 flex-col">
      <a
        href="#content"
        className="bg-background sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        К содержимому
      </a>
      <header className="border-b">
        <SiteHeader site={site} menu={mainMenu} />
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {children}
      </main>
      <footer className="border-t">
        <SiteFooter site={site} menu={footerMenu} />
      </footer>
    </div>
  );
}
