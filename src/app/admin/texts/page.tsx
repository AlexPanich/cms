import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
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
import { requirePagePermission } from "@/server/auth/session";
import { listTexts } from "@/server/texts/service";

export const metadata: Metadata = { title: "Тексты" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

export default async function TextsPage({ searchParams }: PageProps<"/admin/texts">) {
  await requirePagePermission("edit_texts", "/admin/texts");
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseSearch(params.q);
  const { items, total } = await listTexts(db(), { page, search });

  return (
    <>
      <PageHeader
        title="Тексты"
        description="Именованные блоки текста, которые шаблоны вставляют по ключу"
      >
        <ButtonLink href="/admin/texts/new">
          <PlusIcon />
          Добавить
        </ButtonLink>
      </PageHeader>

      <div className="mb-4">
        <SearchForm defaultValue={search} placeholder="Поиск по названию, ключу или тексту" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Текст</TableHead>
              <TableHead className="text-right">Изменён</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                  {search ? "Ничего не нашлось" : "Текстов пока нет"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((text) => (
                <TableRow key={text.id}>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/texts/${text.id}`}
                        className="font-medium hover:underline"
                      >
                        {text.title}
                      </Link>
                      {!text.published && <Badge variant="outline">скрыт</Badge>}
                    </div>
                    <div className="text-muted-foreground text-xs">{text.key}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md truncate align-top">
                    {text.body || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right align-top">
                    {dateFormat.format(text.updatedAt)}
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
        basePath="/admin/texts"
        search={search}
      />
    </>
  );
}
