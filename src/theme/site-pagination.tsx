import Link from "next/link";

// Пагинация публичных списков: ссылки «Назад» и «Дальше» с сохранением параметров.
export function SitePagination({
  page,
  pageCount,
  basePath,
  params = {},
}: {
  page: number;
  pageCount: number;
  basePath: string;
  params?: Record<string, string>;
}) {
  if (pageCount <= 1) return null;
  const href = (target: number) => {
    const query = new URLSearchParams(params);
    if (target > 1) query.set("page", String(target));
    return query.size > 0 ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav aria-label="Страницы" className="mt-10 flex items-center gap-4 text-sm">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="underline underline-offset-4">
          ← Назад
        </Link>
      )}
      <span className="text-muted-foreground">
        Страница {page} из {pageCount}
      </span>
      {page < pageCount && (
        <Link href={href(page + 1)} rel="next" className="underline underline-offset-4">
          Дальше →
        </Link>
      )}
    </nav>
  );
}
