"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ButtonLink } from "@/components/admin/button-link";
import { FormInput, FormSelect } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";
import { menuItemFormSchema } from "@/server/menus/schema";
import { createMenuItem, updateMenuItem } from "../actions";

type FormValues = z.input<typeof menuItemFormSchema>;

export type PageOption = { id: number; title: string; depth: number };

// В Base UI Select значение null означает «ничего не выбрано» и не показывает подпись.
const NO_PAGE = "none";

const kindOptions = [
  { value: "page", label: "Страница сайта" },
  { value: "url", label: "Произвольная ссылка" },
];

export function MenuItemForm({
  menuId,
  item,
  pages,
}: {
  menuId: number;
  item?: { id: number } & FormValues;
  pages: PageOption[];
}) {
  const router = useRouter();
  const form = useForm<FormValues, unknown, z.output<typeof menuItemFormSchema>>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: item ?? { kind: "page", pageId: null, url: "", label: "" },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const menuPath = `/admin/menus/${menuId}`;

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values): Promise<ActionResult<unknown>> =>
      item ? updateMenuItem(item.id, values) : createMenuItem(menuId, values),
    {
      successMessage: item ? "Пункт сохранён" : "Пункт добавлен",
      onSuccess: () => {
        // Состояние страницы создания сохраняется между визитами. Форму правки
        // при новом визите пересоздаёт key на странице.
        if (!item) form.reset();
        router.push(menuPath);
      },
    },
  );

  const pageItems = [
    { value: NO_PAGE, label: "— Выберите страницу —" },
    ...pages.map((page) => ({
      value: String(page.id),
      label: `${"— ".repeat(page.depth)}${page.title}`,
    })),
  ];

  return (
    <form onSubmit={onSubmit} className="max-w-xl">
      <FieldGroup>
        <FormSelect control={form.control} name="kind" label="Куда ведёт" options={kindOptions} />

        {kind === "page" ? (
          <Controller
            control={form.control}
            name="pageId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="pageId">Страница</FieldLabel>
                <Select
                  items={pageItems}
                  value={field.value == null ? NO_PAGE : String(field.value)}
                  onValueChange={(value) =>
                    field.onChange(value === NO_PAGE || value === null ? null : Number(value))
                  }
                >
                  <SelectTrigger id="pageId" className="w-full" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageItems.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ) : (
          <FormInput
            control={form.control}
            name="url"
            label="Адрес ссылки"
            placeholder="https://example.com или /contacts"
            description="Путь на сайте начинается с «/», внешняя ссылка — с http:// или https://"
          />
        )}

        <FormInput
          control={form.control}
          name="label"
          label="Название"
          description={
            kind === "page" ? "Если пусто — название страницы в меню или её заголовок" : undefined
          }
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : item ? "Сохранить" : "Добавить пункт"}
          </Button>
          <ButtonLink href={menuPath} variant="outline">
            Отмена
          </ButtonLink>
        </div>
      </FieldGroup>
    </form>
  );
}
