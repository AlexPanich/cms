import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { listGalleryOptions } from "@/server/galleries/service";
import { getPageTree } from "@/server/pages/service";
import { flattenTree } from "@/server/pages/tree";
import { PageForm } from "../_components/page-form";

export const metadata: Metadata = { title: "Новая страница" };

export default async function NewPagePage({ searchParams }: PageProps<"/admin/pages/new">) {
  await requirePagePermission("edit_pages", "/admin/pages/new");
  const { parent } = await searchParams;
  const [tree, galleries] = await Promise.all([getPageTree(db()), listGalleryOptions(db())]);
  const parents = flattenTree(tree).map(({ id, title, depth }) => ({ id, title, depth }));

  // ?parent=<id> из кнопки «Добавить подстраницу»; неизвестный id игнорируем.
  const requested = typeof parent === "string" ? Number(parent) : NaN;
  const defaultParentId = parents.some((p) => p.id === requested) ? requested : null;

  return (
    <>
      <PageHeader title="Новая страница" />
      {/* key: при переходе на другой ?parent= форма монтируется заново с новым родителем. */}
      <PageForm
        key={defaultParentId ?? "root"}
        parents={parents}
        linkPages={parents}
        defaultParentId={defaultParentId}
        galleries={galleries}
      />
    </>
  );
}
