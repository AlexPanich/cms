import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Fragment, Suspense } from "react";
import { db } from "@/db";
import { pageCount, parsePage, parseSearch } from "@/lib/pagination";
import { HIGHLIGHT_END, HIGHLIGHT_START, searchSite } from "@/server/site/service";
import { SitePagination } from "../_components/site-pagination";
import { getSiteInfo } from "../_lib/data";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const site = await getSiteInfo();
  // Результаты поиска поисковикам индексировать незачем.
  return { title: `Поиск — ${site.name}`, robots: { index: false } };
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">Поиск</h1>
      <Suspense>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const query = parseSearch(params.q);
  const page = parsePage(params.page);
  const { items, total } = query
    ? await searchSite(db(), { query, page })
    : { items: [], total: 0 };

  return (
    <>
      {/* key: поле обновляется при переходе между запросами без перезагрузки. */}
      <form role="search" className="mb-8 flex gap-2" key={query}>
        <input
          type="search"
          name="q"
          defaultValue={query}
          aria-label="Что искать"
          placeholder="Например: контакты"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 flex-1 rounded-md border bg-transparent px-3 outline-none focus-visible:ring-3"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-4 text-sm font-medium"
        >
          Найти
        </button>
      </form>

      {query && (
        <p className="text-muted-foreground mb-6 text-sm" role="status">
          {total > 0 ? `Найдено: ${total}` : `По запросу «${query}» ничего не нашлось`}
        </p>
      )}

      <ol className="flex flex-col gap-6">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-lg font-medium underline-offset-4 hover:underline"
            >
              {item.title}
            </Link>
            <div className="text-muted-foreground text-xs">
              {item.kind === "article" ? "Статья" : "Страница"} · {item.href}
            </div>
            {item.snippet && <p className="mt-1">{highlight(item.snippet)}</p>}
          </li>
        ))}
      </ol>

      <SitePagination
        page={page}
        pageCount={pageCount(total)}
        basePath="/search"
        params={{ q: query }}
      />
    </>
  );
}

// Фрагмент от ts_headline с маркерами вокруг совпадений → текст с <mark>. Сам фрагмент
// выводится как текст, поэтому HTML со страницы не исполнится.
function highlight(snippet: string) {
  return snippet.split(HIGHLIGHT_START).map((part, index) => {
    if (index === 0) return <Fragment key={index}>{part}</Fragment>;
    const [match, rest = ""] = part.split(HIGHLIGHT_END);
    return (
      <Fragment key={index}>
        <mark className="bg-yellow-200/70 dark:bg-yellow-500/30">{match}</mark>
        {rest}
      </Fragment>
    );
  });
}
