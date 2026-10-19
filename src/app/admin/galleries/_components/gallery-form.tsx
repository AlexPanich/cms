"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormInput } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/slug";
import { galleryInputSchema } from "@/server/galleries/schema";
import { createGallery, updateGallery } from "../actions";

type FormValues = z.input<typeof galleryInputSchema>;

export function GalleryForm({ gallery }: { gallery?: { id: number } & FormValues }) {
  const router = useRouter();
  const form = useForm<FormValues, unknown, z.output<typeof galleryInputSchema>>({
    resolver: zodResolver(galleryInputSchema),
    defaultValues: gallery ?? { key: "", title: "" },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values): Promise<ActionResult<{ id: number } | void>> =>
      gallery ? updateGallery(gallery.id, values) : createGallery(values),
    {
      successMessage: gallery ? "Галерея сохранена" : "Галерея создана",
      onSuccess: (data) => {
        if (gallery) return router.refresh();
        form.reset(); // состояние страницы создания сохраняется между визитами
        // Сразу на страницу галереи: следующий шаг — загрузить картинки.
        if (data) router.push(`/admin/galleries/${data.id}`);
      },
    },
  );

  // Для новой галереи предлагаем ключ из названия, пока его не заполнили вручную.
  const suggestKey = () => {
    if (!gallery && !form.getValues("key")) {
      form.setValue("key", slugify(form.getValues("title")), { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup>
        <FormInput
          control={form.control}
          name="title"
          label="Название"
          autoComplete="off"
          onBlur={suggestKey}
        />
        <FormInput
          control={form.control}
          name="key"
          label="Ключ"
          autoComplete="off"
          description={
            gallery
              ? "По ключу галерея вставляется в текст страниц: после смены ключа поправьте вставки"
              : "Латиница, цифры и дефисы. По нему галерея вставляется в текст страниц"
          }
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : gallery ? "Сохранить" : "Создать галерею"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
