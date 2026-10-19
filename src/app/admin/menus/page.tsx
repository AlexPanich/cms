import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { listMenus } from "@/server/menus/service";

export const metadata: Metadata = { title: "Меню" };

// Набор меню задаётся сидом: шаблоны сайта находят меню по ключу. Здесь правятся только пункты.
export default async function MenusPage() {
  await requirePagePermission("edit_menus", "/admin/menus");
  const menus = await listMenus(db());

  return (
    <>
      <PageHeader title="Меню" description="Пункты меню сайта и их порядок" />
      <div className="max-w-3xl rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Меню</TableHead>
              <TableHead className="text-right">Пунктов</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id}>
                <TableCell>
                  <Link href={`/admin/menus/${menu.id}`} className="font-medium hover:underline">
                    {menu.title}
                  </Link>
                  <div className="text-muted-foreground text-xs">{menu.key}</div>
                </TableCell>
                <TableCell className="text-right">{menu.itemCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
