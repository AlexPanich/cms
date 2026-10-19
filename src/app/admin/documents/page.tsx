import { DownloadIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/admin/button-link";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { formatFileSize } from "@/lib/format";
import { pageCount, parsePage, parseSearch } from "@/lib/pagination";
import { requirePagePermission } from "@/server/auth/session";
import { listDocuments } from "@/server/documents/service";

export const metadata: Metadata = { title: "Документы" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

export default async function DocumentsPage({ searchParams }: PageProps<"/admin/documents">) {
  await requirePagePermission("edit_media", "/admin/documents");
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseSearch(params.q);
  const { items, total } = await listDocuments(db(), { page, search });

  return (
    <>
      <PageHeader title="Документы" description="Файлы для скачивания с сайта">
        <ButtonLink href="/admin/documents/new">
          <PlusIcon />
          Загрузить
        </ButtonLink>
      </PageHeader>

      <div className="mb-4">
        <SearchForm defaultValue={search} placeholder="Поиск по названию или имени файла" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Размер</TableHead>
              <TableHead className="text-right">Загружен</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Скачать</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  {search ? "Ничего не нашлось" : "Документов пока нет"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <Link
                      href={`/admin/documents/${document.id}`}
                      className="font-medium hover:underline"
                    >
                      {document.title}
                    </Link>
                    <div className="text-muted-foreground text-xs">{document.originalName}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {formatFileSize(document.size)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {dateFormat.format(document.createdAt)}
                  </TableCell>
                  <TableCell>
                    {/* Обычная ссылка, не next/link: обработчик отдаёт файл как вложение. */}
                    <a
                      href={document.url}
                      download
                      className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                      aria-label={`Скачать «${document.title}»`}
                    >
                      <DownloadIcon />
                    </a>
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
        basePath="/admin/documents"
        search={search}
      />
    </>
  );
}
