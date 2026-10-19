import { ImageIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/admin/button-link";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { pageCount, parsePage, parseSearch } from "@/lib/pagination";
import { requirePagePermission } from "@/server/auth/session";
import { listGalleries } from "@/server/galleries/service";

export const metadata: Metadata = { title: "Галереи" };

export default async function GalleriesPage({ searchParams }: PageProps<"/admin/galleries">) {
  await requirePagePermission("edit_media", "/admin/galleries");
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseSearch(params.q);
  const { items, total } = await listGalleries(db(), { page, search });

  return (
    <>
      <PageHeader title="Галереи" description="Наборы изображений для вставки в текст страниц">
        <ButtonLink href="/admin/galleries/new">
          <PlusIcon />
          Добавить
        </ButtonLink>
      </PageHeader>

      <div className="mb-4">
        <SearchForm defaultValue={search} placeholder="Поиск по названию или ключу" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <span className="sr-only">Обложка</span>
              </TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Изображений</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                  {search ? "Ничего не нашлось" : "Галерей пока нет"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((gallery) => (
                <TableRow key={gallery.id}>
                  <TableCell>
                    <div className="bg-muted relative flex size-12 items-center justify-center overflow-hidden rounded-md">
                      {gallery.coverUrl ? (
                        <Image
                          src={gallery.coverUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="text-muted-foreground size-5" aria-hidden />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/galleries/${gallery.id}`}
                      className="font-medium hover:underline"
                    >
                      {gallery.title}
                    </Link>
                    <div className="text-muted-foreground text-xs">{gallery.key}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {gallery.imageCount}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        pageCount={pageCount(total)}
        basePath="/admin/galleries"
        search={search}
      />
    </>
  );
}
