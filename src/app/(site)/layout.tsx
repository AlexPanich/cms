import { Suspense } from "react";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader, SiteHeaderFallback } from "./_components/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a
        href="#content"
        className="bg-background sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        К содержимому
      </a>
      <header className="border-b">
        <Suspense fallback={<SiteHeaderFallback />}>
          <SiteHeader />
        </Suspense>
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {children}
      </main>
      <footer className="border-t">
        <Suspense>
          <SiteFooter />
        </Suspense>
      </footer>
    </div>
  );
}
