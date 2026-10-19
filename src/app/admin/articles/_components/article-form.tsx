"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  FormCheckbox,
  FormInput,
  FormRichText,
  FormTextarea,
} from "@/components/admin/form-fields";
import { FormImageUpload } from "@/components/admin/image-upload";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/slug";
import { articleInputSchema } from "@/server/articles/schema";
import { createArticle, updateArticle, uploadArticlePreview } from "../actions";

type FormValues = z.input<typeof articleInputSchema>;

export function ArticleForm({
  article,
}: {
  article?: { id: number; previewUrl: string | null } & FormValues;
}) {
  const router = useRouter();
  const form = useForm<FormValues, unknown, z.output<typeof articleInputSchema>>({
    resolver: zodResolver(articleInputSchema),
    defaultValues: article ?? {
      slug: "",
      title: "",
      excerpt: "",
      content: null,
      previewId: null,
      published: false,
    },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values): Promise<ActionResult<unknown>> =>
      article ? updateArticle(article.id, values) : createArticle(values),
    {
      successMessage: article ? "Статья сохранена" : "Статья создана",
      onSuccess: () => {
        if (article) return router.refresh();
        form.reset(); // состояние страницы создания сохраняется между визитами
        router.push("/admin/articles");
      },
    },
  );

  const suggestSlug = () => {
    if (!article && !form.getValues("slug")) {
      form.setValue("slug", slugify(form.getValues("title")), { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <FieldGroup>
        <FormInput control={form.control} name="title" label="Заголовок" onBlur={suggestSlug} />
        <FormInput
          control={form.control}
          name="slug"
          label="Адрес (slug)"
          description="Часть URL: латиница, цифры и дефисы"
        />
        <FormImageUpload
          control={form.control}
          name="previewId"
          label="Превью"
          description="JPEG, PNG, WebP, GIF или AVIF до 10 МБ. Сохраняется в WebP, длинная сторона — до 2560 px"
          upload={uploadArticlePreview}
          initialUrl={article?.previewUrl ?? null}
        />
        <FormTextarea
          control={form.control}
          name="excerpt"
          label="Анонс"
          description="Короткий текст для списка статей, до 500 символов"
          rows={3}
        />
        <FormRichText control={form.control} name="content" label="Текст статьи" />

        <FieldSeparator />

        <FormCheckbox
          control={form.control}
          name="published"
          label="Опубликована"
          description="Дата публикации ставится при первой публикации"
        />

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : article ? "Сохранить" : "Создать статью"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
