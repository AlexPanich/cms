import Image from "next/image";
import Link from "next/link";
import { RichText, type RichTextWidgets } from "@/components/site/rich-text";
import type { ArticleListProps, ArticleProps, Crumb, SearchProps } from "@/components/site/theme";

export const PROSE = "prose prose-invert prose-lg max-w-none";

// Галерея в тексте — простым списком картинок без сетки.
export const WIDGETS: RichTextWidgets = {
  gallery: ({ gallery }) => (
    <figure className="not-prose my-8">
      <ul className="flex gap-2 overflow-x-auto">
        {gallery.images.map((image) => (
          <li key={image.url} className="shrink-0">
            <Image
              src={image.url}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="h-40 w-auto"
            />
          </li>
        ))}
      </ul>
      <figcaption className="text-muted-foreground mt-2 text-sm">{gallery.title}</figcaption>
    </figure>
  ),
};

const date = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });

export function Crumbs({ items, current }: { items: Crumb[]; current: string }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-muted-foreground mb-6 text-sm">
      <ol className="flex flex-wrap gap-2">
        {[{ href: "/", title: "Главная" }, ...items].map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.title}</Link> ›
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}

function Pages({
  page,
  pageCount,
  href,
}: {
  page: number;
  pageCount: number;
  href: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Страницы" className="mt-10 flex gap-6">
      {page > 1 && <Link href={href(page - 1)}>Назад</Link>}
      {page < pageCount && <Link href={href(page + 1)}>Дальше</Link>}
    </nav>
  );
}

export function ArticleList({ articles, page, pageCount }: ArticleListProps) {
  return (
    <>
      <h1 className="mb-10 text-5xl font-bold">Статьи</h1>
      {articles.length === 0 ? (
        <p>Статей пока нет</p>
      ) : (
        <ol className="divide-border divide-y">
          {articles.map((article) => (
            <li key={article.slug} className="py-5">
              <h2 className="text-2xl">
                <Link href={`/articles/${article.slug}`} className="hover:text-primary">
                  {article.title}
                </Link>
              </h2>
              {article.publishedAt && (
                <time
                  dateTime={article.publishedAt.toISOString()}
                  className="text-muted-foreground text-sm"
                >
                  {date.format(article.publishedAt)}
                </time>
              )}
            </li>
          ))}
        </ol>
      )}
      <Pages
        page={page}
        pageCount={pageCount}
        href={(target) => (target > 1 ? `/articles?page=${target}` : "/articles")}
      />
    </>
  );
}

export function Article({ article, crumbs, context }: ArticleProps) {
  return (
    <article>
      <Crumbs items={crumbs} current={article.title} />
      <h1 className="mb-8 text-5xl font-bold">{article.title}</h1>
      {article.excerpt && <p className="text-primary mb-8 text-xl">{article.excerpt}</p>}
      <RichText doc={article.content} context={context} widgets={WIDGETS} className={PROSE} />
    </article>
  );
}

export function Search({ query, results, total, page, pageCount }: SearchProps) {
  return (
    <div>
      <h1 className="mb-6 text-5xl font-bold">Поиск</h1>
      <form role="search" className="mb-8 flex gap-2" key={query}>
        <input
          type="search"
          name="q"
          defaultValue={query}
          aria-label="Что искать"
          className="border-input bg-background h-10 flex-1 border px-3"
        />
        <button type="submit" className="bg-primary text-primary-foreground px-5">
          Найти
        </button>
      </form>
      {query && (
        <p role="status" className="text-muted-foreground mb-6">
          {total > 0 ? `Найдено: ${total}` : `По запросу «${query}» ничего не нашлось`}
        </p>
      )}
      <ol className="flex flex-col gap-6">
        {results.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-primary text-xl">
              {item.title}
            </Link>
            {item.snippet && (
              <p>
                {item.snippet.map((part, index) =>
                  part.match ? <strong key={index}>{part.text}</strong> : part.text,
                )}
              </p>
            )}
          </li>
        ))}
      </ol>
      <Pages
        page={page}
        pageCount={pageCount}
        href={(target) =>
          `/search?${new URLSearchParams({ q: query, ...(target > 1 ? { page: String(target) } : {}) })}`
        }
      />
    </div>
  );
}

export function NotFound() {
  return (
    <div className="py-20">
      <h1 className="text-primary text-6xl font-bold">Страница не найдена</h1>
      <p className="mt-4">
        <Link href="/">На главную</Link>
      </p>
    </div>
  );
}

export function EmptySite() {
  return (
    <div className="py-20">
      <h1 className="text-6xl font-bold">Сайт ещё не наполнен</h1>
    </div>
  );
}
