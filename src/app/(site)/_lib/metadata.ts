import "server-only";
import type { Metadata } from "next";
import { siteUrl } from "@/server/site/url";
import { getSiteInfo } from "./data";

// Метаданные публичной страницы: заголовок «Страница — Сайт», canonical, Open Graph и карточка
// для соцсетей. Next объединяет метаданные лейаута и страницы поверхностно (openGraph страницы
// заменяет лейаутный целиком), поэтому всё собирается здесь.
export async function siteMetadata({
  title,
  description,
  path,
  image,
  article,
  noindex = false,
}: {
  // Без заголовка — главная: только название сайта.
  title?: string;
  description?: string | null;
  // Канонический адрес; без него canonical не ставится (для страниц вне индекса).
  path?: string;
  image?: string | null;
  article?: { publishedTime: Date | null; modifiedTime: Date };
  noindex?: boolean;
}): Promise<Metadata> {
  const site = await getSiteInfo();
  const text = description || site.description || undefined;
  return {
    metadataBase: new URL(siteUrl()),
    title: title ? `${title} — ${site.name}` : site.name,
    description: text,
    alternates: path ? { canonical: path } : undefined,
    openGraph: {
      type: article ? "article" : "website",
      siteName: site.name,
      locale: "ru_RU",
      title: title ?? site.name,
      description: text,
      url: path,
      images: image ? [image] : undefined,
      ...(article && {
        publishedTime: article.publishedTime?.toISOString(),
        modifiedTime: article.modifiedTime.toISOString(),
      }),
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}
