import Link from "next/link";
import { JsonLd } from "@/components/site/json-ld";
import { absoluteUrl } from "@/server/site/url";

export type Crumb = { href: string; title: string };

export function Breadcrumbs({ items, current }: { items: Crumb[]; current: string }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-muted-foreground mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {[{ href: "/", title: "Главная" }, ...items].map((item) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <Link href={item.href} className="hover:text-foreground transition-colors">
              {item.title}
            </Link>
            <span aria-hidden>/</span>
          </li>
        ))}
        <li aria-current="page" className="text-foreground">
          {current}
        </li>
      </ol>
    </nav>
  );
}

// Те же крошки для поисковиков (BreadcrumbList): в выдаче вместо адреса показывается путь.
export function BreadcrumbsJsonLd({ items, current }: { items: Crumb[]; current: Crumb }) {
  const all = [{ href: "/", title: "Главная" }, ...items, current];
  return (
    <JsonLd
      data={{
        "@type": "BreadcrumbList",
        itemListElement: all.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          item: absoluteUrl(item.href),
        })),
      }}
    />
  );
}
