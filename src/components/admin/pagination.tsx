import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "./button-link";

export function Pagination({
  page,
  pageCount,
  basePath,
  search,
}: {
  page: number;
  pageCount: number;
  basePath: string;
  search?: string;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav aria-label="Страницы" className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="text-muted-foreground mr-2">
        Страница {page} из {pageCount}
      </span>
      {page > 1 ? (
        <ButtonLink href={href(page - 1)} variant="outline" size="icon" aria-label="Назад">
          <ChevronLeftIcon />
        </ButtonLink>
      ) : (
        <Button variant="outline" size="icon" disabled aria-label="Назад">
          <ChevronLeftIcon />
        </Button>
      )}
      {page < pageCount ? (
        <ButtonLink href={href(page + 1)} variant="outline" size="icon" aria-label="Вперёд">
          <ChevronRightIcon />
        </ButtonLink>
      ) : (
        <Button variant="outline" size="icon" disabled aria-label="Вперёд">
          <ChevronRightIcon />
        </Button>
      )}
    </nav>
  );
}
