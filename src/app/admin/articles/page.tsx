import { ImageIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/admin/button-link";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { SearchForm } from "@/components/admin/search-form";
import { Badge } from "@/components/ui/badge";
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
import { listArticles } from "@/server/articles/service";
import { requirePagePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Статьи" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

export default async function ArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  await requirePagePermission("edit_articles", "/admin/articles");
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseSearch(params.q);
  const { items, total } = await listArticles(db(), { page, search });

  return (
    <>
      <PageHeader title="Статьи" description="Новости и публикации с превью">
        <ButtonLink href="/admin/articles/new">
          <PlusIcon />
          Добавить
        </ButtonLink>
      </PageHeader>

      <div className="mb-4">
        <SearchForm defaultValue={search} placeholder="Поиск по заголовку или адресу" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">
                <span className="sr-only">Превью</span>
              </TableHead>
              <TableHead>Заголовок</TableHead>
              <TableHead className="text-right">Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                  {search ? "Ничего не нашлось" : "Статей пока нет"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <div className="bg-muted relative flex size-12 items-center justify-center overflow-hidden rounded-md">
                      {article.previewUrl ? (
                        <Image
                          src={article.previewUrl}
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
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="font-medium hover:underline"
                      >
                        {article.title}
                      </Link>
                      {!article.published && <Badge variant="outline">черновик</Badge>}
                    </div>
                    <div className="text-muted-foreground text-xs">{article.slug}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {dateFormat.format(article.publishedAt ?? article.createdAt)}
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
        basePath="/admin/articles"
        search={search}
      />
    </>
  );
}
