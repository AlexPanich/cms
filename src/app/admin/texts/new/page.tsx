import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requirePagePermission } from "@/server/auth/session";
import { TextForm } from "../_components/text-form";

export const metadata: Metadata = { title: "Новый текст" };

export default async function NewTextPage() {
  await requirePagePermission("edit_texts", "/admin/texts/new");

  return (
    <>
      <PageHeader title="Новый текст" />
      <TextForm />
    </>
  );
}
