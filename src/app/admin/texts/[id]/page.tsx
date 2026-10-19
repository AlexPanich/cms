import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { getText } from "@/server/texts/service";
import { TextForm } from "../_components/text-form";
import { deleteText } from "../actions";

export const metadata: Metadata = { title: "Текст" };

export default async function TextPage({ params }: PageProps<"/admin/texts/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_texts", `/admin/texts/${id}`);

  const textId = Number(id);
  const text = Number.isSafeInteger(textId) && textId > 0 ? await getText(db(), textId) : null;
  if (!text) notFound();

  return (
    <>
      <PageHeader title={text.title} description={text.key}>
        <ConfirmAction
          action={deleteText.bind(null, text.id)}
          title="Удалить текст?"
          description="Шаблоны, которые его используют, выведут пустое место. Действие нельзя отменить."
          successMessage="Текст удалён"
          redirectTo="/admin/texts"
          variant="outline"
        >
          <Trash2Icon />
          Удалить
        </ConfirmAction>
      </PageHeader>

      <TextForm
        text={{
          id: text.id,
          key: text.key,
          title: text.title,
          body: text.body,
          published: text.published,
        }}
      />
    </>
  );
}
