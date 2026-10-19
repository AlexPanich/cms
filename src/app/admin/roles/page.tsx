import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/admin/button-link";
import { PageHeader } from "@/components/admin/page-header";
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
import { PERMISSION_LABELS, PERMISSIONS } from "@/lib/permissions";
import { requirePagePermission } from "@/server/auth/session";
import { listRoles } from "@/server/roles/service";

export const metadata: Metadata = { title: "Роли" };

export default async function RolesPage() {
  await requirePagePermission("edit_roles", "/admin/roles");
  const roles = await listRoles(db());

  return (
    <>
      <PageHeader title="Роли" description="Роль — набор прав, который выдаётся пользователям">
        <ButtonLink href="/admin/roles/new">
          <PlusIcon />
          Добавить
        </ButtonLink>
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Права</TableHead>
              <TableHead className="text-right">Пользователей</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="align-top">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/roles/${role.id}`} className="font-medium hover:underline">
                      {role.name}
                    </Link>
                    {role.isSystem && <Badge variant="outline">системная</Badge>}
                  </div>
                  <div className="text-muted-foreground text-xs">{role.key}</div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {role.permissions.length === PERMISSIONS.length ? (
                    <Badge>Все права</Badge>
                  ) : role.permissions.length === 0 ? (
                    <span className="text-muted-foreground">Нет прав</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {PERMISSION_LABELS[permission]}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right align-top">{role.userCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
