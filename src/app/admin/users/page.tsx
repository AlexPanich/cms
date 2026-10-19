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
import { listUsers } from "@/server/users/service";

export const metadata: Metadata = { title: "Пользователи" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" });

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requirePagePermission("edit_users", "/admin/users");
  const params = await searchParams;
  const page = parsePage(params.page);
  const search = parseSearch(params.q);
  const { items, total } = await listUsers(db(), { page, search });

  return (
    <>
      <PageHeader title="Пользователи" description="Учётные записи, их роли и пароли">
        <ButtonLink href="/admin/users/new">
          <PlusIcon />
          Добавить
        </ButtonLink>
      </PageHeader>

      <div className="mb-4">
        <SearchForm defaultValue={search} placeholder="Поиск по имени или email" />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Роли</TableHead>
              <TableHead className="text-right">Создан</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                  {search ? "Никого не нашлось" : "Пользователей пока нет"}
                </TableCell>
              </TableRow>
            ) : (
              items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/users/${user.id}`} className="hover:underline">
                      {user.name}
                    </Link>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role.key} variant="secondary">
                            {role.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {dateFormat.format(user.createdAt)}
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
        basePath="/admin/users"
        search={search}
      />
    </>
  );
}
