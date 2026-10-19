import { Trash2Icon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { PageHeader } from "@/components/admin/page-header";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { requirePagePermission } from "@/server/auth/session";
import { getGallery, getGalleryImages } from "@/server/galleries/service";
import { GalleryForm } from "../_components/gallery-form";
import { GalleryImages } from "../_components/gallery-images";
import { deleteGallery } from "../actions";

export const metadata: Metadata = { title: "Галерея" };

export default async function GalleryPage({ params }: PageProps<"/admin/galleries/[id]">) {
  const { id } = await params;
  await requirePagePermission("edit_media", `/admin/galleries/${id}`);

  const galleryId = Number(id);
  const gallery =
    Number.isSafeInteger(galleryId) && galleryId > 0 ? await getGallery(db(), galleryId) : null;
  if (!gallery) notFound();
  const images = await getGalleryImages(db(), gallery.id);

  return (
    <>
      <PageHeader title={gallery.title} description={gallery.key}>
        <ConfirmAction
          action={deleteGallery.bind(null, gallery.id)}
          title="Удалить галерею?"
          description="Галерея пропадёт со страниц, куда она вставлена. Изображения, которые больше нигде не используются, будут удалены. Действие нельзя отменить."
          successMessage="Галерея удалена"
          redirectTo="/admin/galleries"
          variant="outline"
        >
          <Trash2Icon />
          Удалить
        </ConfirmAction>
      </PageHeader>

      <section aria-labelledby="gallery-images" className="mb-8">
        <h2 id="gallery-images" className="mb-1 text-lg font-medium">
          Изображения
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Перетаскивайте изображения за ручку, чтобы изменить порядок
        </p>
        <GalleryImages galleryId={gallery.id} images={images} />
      </section>

      <Separator className="mb-8" />

      <section aria-labelledby="gallery-settings">
        <h2 id="gallery-settings" className="mb-4 text-lg font-medium">
          Настройки
        </h2>
        <GalleryForm gallery={{ id: gallery.id, key: gallery.key, title: gallery.title }} />
      </section>
    </>
  );
}
