import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/admin/button-link";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { getMenu, getMenuItems } from "@/server/menus/service";
import { MenuItemList } from "../_components/menu-item-list";
import { parseId } from "../_components/parse-id";

export const metadata: Metadata = { title: "Меню" };

export default async function MenuPage({ params }: PageProps<"/admin/menus/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_menus", `/admin/menus/${id}`);

  const menuId = parseId(id);
  const menu = menuId ? await getMenu(db(), menuId) : null;
  if (!menu) notFound();
  const items = await getMenuItems(db(), menu.id);

  return (
    <>
      <PageHeader
        title={menu.title}
        description="Перетаскивайте пункты за ручку, чтобы изменить порядок"
      >
        <ButtonLink href={`/admin/menus/${menu.id}/items/new`}>
          <PlusIcon />
          Добавить пункт
        </ButtonLink>
      </PageHeader>
      <div className="max-w-3xl">
        <MenuItemList menuId={menu.id} items={items} />
      </div>
    </>
  );
}
