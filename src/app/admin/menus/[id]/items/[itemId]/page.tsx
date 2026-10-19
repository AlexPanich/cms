import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { getMenu, getMenuItem } from "@/server/menus/service";
import { getPageTree } from "@/server/pages/service";
import { flattenTree } from "@/server/pages/tree";
import { MenuItemForm } from "../../../_components/menu-item-form";
import { parseId } from "../../../_components/parse-id";

export const metadata: Metadata = { title: "Пункт меню" };

export default async function EditMenuItemPage({
  params,
}: PageProps<"/admin/menus/[id]/items/[itemId]">) {
  const { id, itemId } = await params;
  await requirePagePermission("edit_menus", `/admin/menus/${id}/items/${itemId}`);

  const menuId = parseId(id);
  const itemKey = parseId(itemId);
  const item = itemKey ? await getMenuItem(db(), itemKey) : null;
  // Пункт из другого меню по чужому адресу не показываем.
  const menu = item && item.menuId === menuId ? await getMenu(db(), item.menuId) : null;
  if (!item || !menu) notFound();
  const pages = flattenTree(await getPageTree(db()));

  return (
    <>
      <PageHeader title="Пункт меню" description={menu.title} />
      {/* key: при следующем визите после сохранения форма берёт свежие данные. */}
      <MenuItemForm
        key={item.updatedAt.toISOString()}
        menuId={menu.id}
        pages={pages.map(({ id, title, depth }) => ({ id, title, depth }))}
        item={{
          id: item.id,
          kind: item.pageId === null ? "url" : "page",
          pageId: item.pageId,
          url: item.url ?? "",
          label: item.label ?? "",
        }}
      />
    </>
  );
}
