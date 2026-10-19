"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import type { z } from "@/lib/zod";
import {
  FormCheckbox,
  FormInput,
  FormRichText,
  FormSelect,
  FormTextarea,
} from "@/components/admin/form-fields";
import type { GalleryOption } from "@/components/admin/gallery-node";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/slug";
import { DEFAULT_PAGE_TEMPLATE, PAGE_TEMPLATES } from "@/lib/templates";
import { pageInputSchema } from "@/server/pages/schema";
import { createPage, updatePage } from "../actions";

type FormValues = z.input<typeof pageInputSchema>;

export type ParentOption = { id: number; title: string; depth: number };

const ROOT = "root";

const templateOptions = PAGE_TEMPLATES.map((template) => ({
  value: template.key,
  label: `${template.label} — ${template.description}`,
}));

export function PageForm({
  page,
  parents,
  galleries,
  defaultParentId = null,
}: {
  page?: { id: number } & FormValues;
  parents: ParentOption[];
  galleries: GalleryOption[];
  defaultParentId?: number | null;
}) {
  const router = useRouter();
  const form = useForm<FormValues, unknown, z.output<typeof pageInputSchema>>({
    resolver: zodResolver(pageInputSchema),
    defaultValues: page ?? {
      parentId: defaultParentId,
      slug: "",
      title: "",
      menuTitle: "",
      metaDescription: "",
      content: null,
      template: DEFAULT_PAGE_TEMPLATE,
      published: false,
      isHome: false,
    },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values): Promise<ActionResult<unknown>> =>
      page ? updatePage(page.id, values) : createPage(values),
    {
      successMessage: page ? "Страница сохранена" : "Страница создана",
      onSuccess: () => {
        if (page) return router.refresh();
        form.reset(); // см. CreateUserForm: состояние страницы создания сохраняется между визитами
        router.push("/admin/pages");
      },
    },
  );

  const suggestSlug = () => {
    if (!page && !form.getValues("slug")) {
      form.setValue("slug", slugify(form.getValues("title")), { shouldValidate: true });
    }
  };

  // В Base UI Select значение null означает «ничего не выбрано», поэтому корень — отдельный ключ.
  const parentItems = [
    { value: ROOT, label: "— Корень сайта —" },
    ...parents.map((parent) => ({
      value: String(parent.id),
      label: `${"— ".repeat(parent.depth)}${parent.title}`,
    })),
  ];

  return (
    <form onSubmit={onSubmit} className="max-w-3xl">
      <FieldGroup>
        <FormInput control={form.control} name="title" label="Заголовок" onBlur={suggestSlug} />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormInput
            control={form.control}
            name="slug"
            label="Адрес (slug)"
            description="Часть URL: латиница, цифры и дефисы"
          />
          <Controller
            control={form.control}
            name="parentId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="parentId">Родительская страница</FieldLabel>
                <Select
                  items={parentItems}
                  value={field.value === null ? ROOT : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === ROOT || value === null ? null : Number(value))
                  }
                >
                  <SelectTrigger id="parentId" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parentItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Смена родителя меняет адреса всех вложенных страниц
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <FormRichText
          control={form.control}
          name="content"
          label="Содержимое"
          galleries={galleries}
        />

        <FieldSeparator />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormInput
            control={form.control}
            name="menuTitle"
            label="Название в меню"
            description="Если пусто — используется заголовок"
          />
          <FormSelect
            control={form.control}
            name="template"
            label="Шаблон"
            options={templateOptions}
          />
        </div>
        <FormTextarea
          control={form.control}
          name="metaDescription"
          label="Описание для поисковиков"
          description="meta description, до 300 символов"
          rows={2}
        />

        <FieldSeparator />

        <FormCheckbox
          control={form.control}
          name="published"
          label="Опубликована"
          description="Неопубликованная страница и её вложенные страницы не видны на сайте"
        />
        <FormCheckbox
          control={form.control}
          name="isHome"
          label="Главная страница сайта"
          description="Открывается по адресу «/». Главная может быть только одна"
        />

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : page ? "Сохранить" : "Создать страницу"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
