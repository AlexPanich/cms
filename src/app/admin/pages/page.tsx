import { PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/admin/button-link";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { getPageTree } from "@/server/pages/service";
import { PageTree } from "./_components/page-tree";

export const metadata: Metadata = { title: "Страницы" };

export default async function PagesPage() {
  await requirePagePermission("edit_pages", "/admin/pages");
  const tree = await getPageTree(db());

  return (
    <>
      <PageHeader
        title="Страницы"
        description="Перетаскивайте страницы за ручку, чтобы изменить порядок в меню"
      >
        <ButtonLink href="/admin/pages/new">
          <PlusIcon />
          Добавить
        </ButtonLink>
      </PageHeader>
      <div className="max-w-3xl">
        <PageTree tree={tree} />
      </div>
    </>
  );
}
