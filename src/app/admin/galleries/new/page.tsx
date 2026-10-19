import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requirePagePermission } from "@/server/auth/session";
import { GalleryForm } from "../_components/gallery-form";

export const metadata: Metadata = { title: "Новая галерея" };

export default async function NewGalleryPage() {
  await requirePagePermission("edit_media", "/admin/galleries/new");

  return (
    <>
      <PageHeader title="Новая галерея" description="Изображения загружаются после создания" />
      <GalleryForm />
    </>
  );
}
