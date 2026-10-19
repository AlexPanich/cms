import { DownloadIcon, Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/db";
import { formatFileSize } from "@/lib/format";
import { requirePagePermission } from "@/server/auth/session";
import { getDocument } from "@/server/documents/service";
import { DocumentForm } from "../_components/document-form";
import { deleteDocument } from "../actions";

export const metadata: Metadata = { title: "Документ" };

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" });

export default async function DocumentPage({ params }: PageProps<"/admin/documents/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_media", `/admin/documents/${id}`);

  const documentId = Number(id);
  const document =
    Number.isSafeInteger(documentId) && documentId > 0 ? await getDocument(db(), documentId) : null;
  if (!document) notFound();

  return (
    <>
      <PageHeader
        title={document.title ?? document.originalName}
        description={`${document.originalName}, ${formatFileSize(document.size)}, загружен ${dateFormat.format(document.createdAt)}`}
      >
        <a href={document.url} download className={buttonVariants({ variant: "outline" })}>
          <DownloadIcon />
          Скачать
        </a>
        <ConfirmAction
          action={deleteDocument.bind(null, document.id)}
          title="Удалить документ?"
          description="Файл будет удалён, ссылки на него перестанут работать. Действие нельзя отменить."
          successMessage="Документ удалён"
          redirectTo="/admin/documents"
          variant="outline"
        >
          <Trash2Icon />
          Удалить
        </ConfirmAction>
      </PageHeader>

      <DocumentForm document={{ id: document.id, title: document.title ?? "" }} />
    </>
  );
}
