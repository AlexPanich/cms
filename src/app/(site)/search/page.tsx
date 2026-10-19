import type { Metadata } from "next";
import { connection } from "next/server";
import { db } from "@/db";
import type { HighlightPart } from "@/components/site/theme";
import { pageCount, parsePage, parseSearch } from "@/lib/pagination";
import { HIGHLIGHT_END, HIGHLIGHT_START, searchSite } from "@/server/site/service";
import { theme } from "@/theme";
import { siteMetadata } from "../_lib/metadata";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  // Результаты поиска поисковикам индексировать незачем, а ссылки с них — можно.
  return siteMetadata({ title: "Поиск", noindex: true });
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  await connection();
  const params = await searchParams;
  const query = parseSearch(params.q);
  const page = parsePage(params.page);
  const { items, total } = query
    ? await searchSite(db(), { query, page })
    : { items: [], total: 0 };

  return (
    <theme.Search
      query={query}
      results={items.map((item) => ({
        ...item,
        snippet: item.snippet ? highlight(item.snippet) : null,
      }))}
      total={total}
      page={page}
      pageCount={pageCount(total)}
    />
  );
}

// Фрагмент от ts_headline с маркерами вокруг совпадений → части с пометкой совпадения.
// Тема выводит их как текст, поэтому HTML со страницы не исполнится.
function highlight(snippet: string): HighlightPart[] {
  return snippet.split(HIGHLIGHT_START).flatMap((part, index) => {
    if (index === 0) return [{ text: part, match: false }];
    const [match, rest = ""] = part.split(HIGHLIGHT_END);
    return [
      { text: match, match: true },
      { text: rest, match: false },
    ];
  });
}
