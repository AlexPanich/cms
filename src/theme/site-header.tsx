import { SearchIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { resolveImage } from "@/components/site/blocks";
import { EditableText } from "@/components/site/editable";
import type { ContentContext } from "@/components/site/rich-text";
import type { SiteInfo } from "@/components/site/theme";
import type { SiteMenuItem } from "@/server/site/service";
import { SiteNav } from "./site-nav";

export function SiteHeader({
  site,
  menu,
  context,
}: {
  site: SiteInfo;
  menu: SiteMenuItem[];
  context: ContentContext;
}) {
  const logo = resolveImage(context.settings.logo, context);
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
      <EditableText textKey="site-name" value={site.name}>
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
          {/* Ссылку называет название сайта рядом, поэтому у логотипа пустой alt. */}
          {logo && (
            <Image
              src={logo.url}
              alt=""
              width={logo.width}
              height={logo.height}
              priority
              className="h-8 w-auto"
            />
          )}
          {site.name}
        </Link>
      </EditableText>
      <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
        <SiteNav
          items={menu}
          label="Главное меню"
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
          linkClassName="text-muted-foreground hover:text-foreground transition-colors"
        />
      </div>
      <SearchBox />
    </div>
  );
}

// Обычная GET-форма: поиск работает и без JavaScript.
function SearchBox() {
  return (
    <form action="/search" role="search" className="relative ml-auto sm:ml-0">
      <SearchIcon
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        placeholder="Поиск"
        aria-label="Поиск по сайту"
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-40 rounded-md border bg-transparent pr-2 pl-8 text-sm outline-none focus-visible:ring-3"
      />
    </form>
  );
}
