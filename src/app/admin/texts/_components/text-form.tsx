"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { FormCheckbox, FormInput, FormTextarea } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { slugify } from "@/lib/slug";
import { textInputSchema } from "@/server/texts/schema";
import { createText, updateText } from "../actions";

type FormValues = z.input<typeof textInputSchema>;

export function TextForm({ text }: { text?: { id: number } & FormValues }) {
  const router = useRouter();
  const form = useForm<FormValues, unknown, z.output<typeof textInputSchema>>({
    resolver: zodResolver(textInputSchema),
    defaultValues: text ?? { key: "", title: "", body: "", published: true },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values): Promise<ActionResult<unknown>> =>
      text ? updateText(text.id, values) : createText(values),
    {
      successMessage: text ? "Текст сохранён" : "Текст создан",
      onSuccess: () => {
        if (text) return router.refresh();
        form.reset(); // состояние страницы создания сохраняется между визитами
        router.push("/admin/texts");
      },
    },
  );

  // Для нового текста предлагаем ключ из названия, пока его не заполнили вручную.
  const suggestKey = () => {
    if (!text && !form.getValues("key")) {
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
          description="Для админки: где и зачем используется текст"
          autoComplete="off"
          onBlur={suggestKey}
        />
        <FormInput
          control={form.control}
          name="key"
          label="Ключ"
          autoComplete="off"
          description={
            text
              ? "Шаблоны находят текст по ключу: после смены ключа поправьте шаблон"
              : "Латиница, цифры и дефисы. По нему шаблон вставляет текст"
          }
        />
        <FormTextarea
          control={form.control}
          name="body"
          label="Текст"
          rows={6}
          description="Простой текст без оформления, переводы строк сохраняются"
        />
        <FormCheckbox
          control={form.control}
          name="published"
          label="Показывать на сайте"
          description="Скрытый текст на сайте выводится пустым"
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : text ? "Сохранить" : "Создать текст"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
