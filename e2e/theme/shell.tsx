import { PT_Serif } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { resolveImage } from "@/components/site/blocks";
import { EditableSettings, EditableText } from "@/components/site/editable";
import type { SiteLayoutProps } from "@/components/site/theme";
import { phoneHref } from "@/lib/site-settings";
import type { SiteMenuItem } from "@/server/site/service";

const serif = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-e2e-serif",
});

function Menu({ items, label }: { items: SiteMenuItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="hover:text-primary tracking-widest uppercase">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Шапка в две строки: название со слоганом по центру, под ней меню и поиск.
export function SiteLayout({ site, mainMenu, footerMenu, context, children }: SiteLayoutProps) {
  const { settings } = context;
  const logo = resolveImage(settings.logo, context);
  return (
    <div
      className={`${serif.variable} bg-background text-foreground flex min-h-full flex-1 flex-col font-[family-name:var(--font-e2e-serif)]`}
    >
      <a
        href="#content"
        className="bg-primary text-primary-foreground sr-only z-50 px-3 py-2 focus:not-sr-only focus:fixed focus:top-0 focus:left-0"
      >
        К содержимому
      </a>
      <header className="border-primary border-b-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center">
          <EditableText textKey="site-name" value={site.name}>
            <Link href="/" className="flex items-center gap-3 text-3xl font-bold">
              {logo && (
                <Image
                  src={logo.url}
                  alt=""
                  width={logo.width}
                  height={logo.height}
                  className="h-10 w-auto"
                />
              )}
              {site.name}
            </Link>
          </EditableText>
          <EditableSettings fields={["slogan"]} label="слоган">
            {settings.slogan ? (
              <p className="text-muted-foreground italic">{settings.slogan}</p>
            ) : null}
          </EditableSettings>
        </div>
        <div className="bg-card text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Menu items={mainMenu} label="Главное меню" />
            <form action="/search" role="search" className="flex">
              <input
                type="search"
                name="q"
                placeholder="Поиск…"
                aria-label="Поиск по сайту"
                className="border-input bg-background h-8 w-44 border px-2"
              />
            </form>
          </div>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        {children}
      </main>
      <footer className="bg-card text-muted-foreground text-sm">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <EditableText textKey="footer" value={site.footer} multiline>
            <p className="whitespace-pre-line">{site.footer || site.name}</p>
          </EditableText>
          <EditableSettings
            fields={["phone", "email", "address", "hours", "socials"]}
            label="контакты"
          >
            <ul className="flex flex-col gap-1">
              {settings.phone && (
                <li>
                  <a href={phoneHref(settings.phone)}>{settings.phone}</a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </li>
              )}
              {settings.address && <li className="whitespace-pre-line">{settings.address}</li>}
            </ul>
          </EditableSettings>
          <Menu items={footerMenu} label="Меню в подвале" />
        </div>
      </footer>
    </div>
  );
}
