import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/admin/button-link";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { formatFileSize } from "@/lib/format";
import { pageCount, parsePage, parseSearch } from "@/lib/pagination";
import { requirePagePermission } from "@/server/auth/session";
import { type ImageListItem, listImages } from "@/server/media/service";
import { deleteImage } from "./actions";

export const metadata: Metadata = { title: "Изображения" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });
function usage({ galleryUses, articleUses, pageUses, settingsUses }: ImageListItem): string | null {
  const parts = [
    galleryUses > 0 && `галерей: ${galleryUses}`,
    articleUses > 0 && `превью статей: ${articleUses}`,
    pageUses > 0 && `страниц: ${pageUses}`,
    settingsUses > 0 && "настройки сайта",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  await requirePagePermission("edit_media", "/admin/media");
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseSearch(params.q);
  const unused = params.unused === "1";
  const { items, total } = await listImages(db(), { page, search, unused });
  const filterParams: Record<string, string> = unused ? { unused: "1" } : {};
  const filterHref = (onlyUnused: boolean) => {
    const query = new URLSearchParams(onlyUnused ? { unused: "1" } : {});
    if (search) query.set("q", search);
    return `/admin/media${query.size > 0 ? `?${query}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Изображения"
        description="Все загруженные картинки: из галерей и превью статей"
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <SearchForm
          defaultValue={search}
          placeholder="Поиск по имени файла"
          params={filterParams}
        />
        <nav aria-label="Фильтр" className="flex gap-1">
          <ButtonLink
            href={filterHref(false)}
            variant={unused ? "ghost" : "secondary"}
            size="sm"
            aria-current={unused ? undefined : "page"}
          >
            Все
          </ButtonLink>
          <ButtonLink
            href={filterHref(true)}
            variant={unused ? "secondary" : "ghost"}
            size="sm"
            aria-current={unused ? "page" : undefined}
          >
            Неиспользуемые
          </ButtonLink>
        </nav>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          {search
            ? "Ничего не нашлось"
            : unused
              ? "Неиспользуемых изображений нет"
              : "Изображений пока нет"}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((image) => {
            const usedIn = usage(image);
            return (
              <li key={image.id}>
                <figure className="overflow-hidden rounded-lg border">
                  <div className="bg-muted relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.alt ?? ""}
                      fill
                      sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="flex items-start gap-1 p-2 text-xs">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate font-medium" title={image.originalName}>
                        {image.originalName}
                      </span>
                      <span className="text-muted-foreground">
                        {image.width}×{image.height}, {formatFileSize(image.size)},{" "}
                        {dateFormat.format(image.createdAt)}
                      </span>
                      {usedIn ? (
                        <span className="text-muted-foreground">{usedIn}</span>
                      ) : (
                        <Badge variant="outline">не используется</Badge>
                      )}
                    </div>
                    <ConfirmAction
                      action={deleteImage.bind(null, image.id)}
                      title="Удалить изображение?"
                      description={
                        usedIn
                          ? `Изображение используется (${usedIn}). Оно пропадёт из галерей, у статей уберётся превью. Действие нельзя отменить.`
                          : "Файл будет удалён. Действие нельзя отменить."
                      }
                      successMessage="Изображение удалено"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Удалить «${image.originalName}»`}
                    >
                      <Trash2Icon />
                    </ConfirmAction>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        pageCount={pageCount(total)}
        basePath="/admin/media"
        search={search}
        params={filterParams}
      />
    </>
  );
}
