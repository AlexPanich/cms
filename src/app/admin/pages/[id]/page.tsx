import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { isPageTemplate } from "@/lib/templates";
import { requirePagePermission } from "@/server/auth/session";
import { getPage, getPageTree } from "@/server/pages/service";
import { flattenTree, subtreeIds } from "@/server/pages/tree";
import { PageForm } from "../_components/page-form";
import { deletePage } from "../actions";

export const metadata: Metadata = { title: "Страница" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_pages", `/admin/pages/${id}`);

  const pageId = Number(id);
  const page = Number.isSafeInteger(pageId) && pageId > 0 ? await getPage(db(), pageId) : null;
  if (!page) notFound();

  // В родители нельзя выбрать саму страницу и её потомков — сервер тоже это проверяет.
  const flat = flattenTree(await getPageTree(db()));
  const self = flat.find((node) => node.id === page.id);
  const excluded = new Set(self ? subtreeIds(self) : [page.id]);
  const parents = flat
    .filter((node) => !excluded.has(node.id))
    .map(({ id, title, depth }) => ({ id, title, depth }));
  const hasChildren = (self?.children.length ?? 0) > 0;

  return (
    <>
      <PageHeader title={page.title} description={`/${page.path}`}>
        <ConfirmAction
          action={deletePage.bind(null, page.id)}
          title="Удалить страницу?"
          description={
            hasChildren
              ? "У страницы есть вложенные страницы — сначала перенесите или удалите их."
              : "Страница пропадёт с сайта и из меню. Действие нельзя отменить."
          }
          successMessage="Страница удалена"
          redirectTo="/admin/pages"
          variant="outline"
        >
          <Trash2Icon />
          Удалить
        </ConfirmAction>
      </PageHeader>

      <PageForm
        parents={parents}
        page={{
          id: page.id,
          parentId: page.parentId,
          slug: page.slug,
          title: page.title,
          menuTitle: page.menuTitle ?? "",
          metaDescription: page.metaDescription ?? "",
          content: page.content,
          // Шаблон могли убрать из реестра — тогда предлагаем стандартный.
          template: isPageTemplate(page.template) ? page.template : "default",
          published: page.published,
          isHome: page.isHome,
        }}
      />
    </>
  );
}
