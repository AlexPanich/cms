import { absoluteUrl } from "@/server/site/url";
import { JsonLd } from "./json-ld";
import type { Crumb } from "./theme";

// Хлебные крошки для поисковиков (BreadcrumbList): в выдаче вместо адреса показывается путь.
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
