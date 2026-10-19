import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { listGalleryOptions } from "@/server/galleries/service";
import { ArticleForm } from "../_components/article-form";

export const metadata: Metadata = { title: "Новая статья" };

export default async function NewArticlePage() {
  await requirePagePermission("edit_articles", "/admin/articles/new");
  const galleries = await listGalleryOptions(db());

  return (
    <>
      <PageHeader title="Новая статья" />
      <ArticleForm galleries={galleries} />
    </>
  );
}
