import Link from "next/link";
import type { SearchProps } from "@/components/site/theme";
import { SitePagination } from "./site-pagination";

export function Search({ query, results, total, page, pageCount }: SearchProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">Поиск</h1>
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
        {results.map((item) => (
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
            {item.snippet && (
              <p className="mt-1">
                {item.snippet.map((part, index) =>
                  part.match ? (
                    <mark key={index} className="bg-yellow-200/70 dark:bg-yellow-500/30">
                      {part.text}
                    </mark>
                  ) : (
                    part.text
                  ),
                )}
              </p>
            )}
          </li>
        ))}
      </ol>

      <SitePagination page={page} pageCount={pageCount} basePath="/search" params={{ q: query }} />
    </div>
  );
}
