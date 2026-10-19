import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requirePagePermission } from "@/server/auth/session";
import { DocumentForm } from "../_components/document-form";

export const metadata: Metadata = { title: "Новый документ" };

export default async function NewDocumentPage() {
  await requirePagePermission("edit_media", "/admin/documents/new");

  return (
    <>
      <PageHeader title="Новый документ" />
      <DocumentForm />
    </>
  );
}
