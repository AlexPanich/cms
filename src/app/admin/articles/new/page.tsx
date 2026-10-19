import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requirePagePermission } from "@/server/auth/session";
import { ArticleForm } from "../_components/article-form";

export const metadata: Metadata = { title: "Новая статья" };

export default async function NewArticlePage() {
  await requirePagePermission("edit_articles", "/admin/articles/new");

  return (
    <>
      <PageHeader title="Новая статья" />
      <ArticleForm />
    </>
  );
}
