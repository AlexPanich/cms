import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { getMenu } from "@/server/menus/service";
import { getPageTree } from "@/server/pages/service";
import { flattenTree } from "@/server/pages/tree";
import { MenuItemForm } from "../../../_components/menu-item-form";
import { parseId } from "../../../_components/parse-id";

export const metadata: Metadata = { title: "Новый пункт меню" };

export default async function NewMenuItemPage({
  params,
}: PageProps<"/admin/menus/[id]/items/new">) {
  const { id } = await params;
  await requirePagePermission("edit_menus", `/admin/menus/${id}/items/new`);

  const menuId = parseId(id);
  const menu = menuId ? await getMenu(db(), menuId) : null;
  if (!menu) notFound();
  const pages = flattenTree(await getPageTree(db()));

  return (
    <>
      <PageHeader title="Новый пункт" description={menu.title} />
      <MenuItemForm
        menuId={menu.id}
        pages={pages.map(({ id, title, depth }) => ({ id, title, depth }))}
      />
    </>
  );
}
