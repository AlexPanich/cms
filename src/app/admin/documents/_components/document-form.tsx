"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileIcon, UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "@/lib/zod";
import { FormInput } from "@/components/admin/form-fields";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DOCUMENT_ACCEPT, documentExtension, MAX_DOCUMENT_BYTES } from "@/lib/media";
import { documentInputSchema } from "@/server/documents/schema";
import { createDocument, updateDocument } from "../actions";

// Для загрузки к названию добавляется файл. Те же проверки повторяет сервер,
// плюс проверяет содержимое файла.
const uploadSchema = documentInputSchema.extend({
  file: z
    .instanceof(File, { message: "Выберите файл" })
    .refine((file) => documentExtension(file.name) !== null, "Такой тип файла не поддерживается")
    .refine((file) => file.size <= MAX_DOCUMENT_BYTES, "Файл больше 20 МБ"),
});

type UploadValues = z.input<typeof uploadSchema>;
type EditValues = z.input<typeof documentInputSchema>;

export function DocumentForm({ document }: { document?: { id: number } & EditValues }) {
  return document ? <EditForm document={document} /> : <UploadForm />;
}

function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const form = useForm<UploadValues, unknown, z.output<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { title: "", file: undefined },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values) => {
      const formData = new FormData();
      formData.set("title", values.title);
      formData.set("file", values.file);
      return createDocument(formData);
    },
    {
      successMessage: "Документ загружен",
      onSuccess: () => {
        form.reset(); // состояние страницы создания сохраняется между визитами
        router.push("/admin/documents");
      },
    },
  );

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup>
        <Controller
          control={form.control}
          name="file"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="file">Файл</FieldLabel>
              <input
                ref={inputRef}
                id="file"
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = ""; // чтобы тот же файл можно было выбрать снова
                  if (!file) return;
                  field.onChange(file);
                  void form.trigger("file");
                  // Название по имени файла, пока его не заполнили вручную.
                  if (!form.getValues("title")) {
                    form.setValue("title", file.name.replace(/\.[^.]+$/, ""), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadIcon />
                  {field.value ? "Выбрать другой" : "Выбрать файл"}
                </Button>
                {field.value && (
                  <span className="flex min-w-0 items-center gap-1 text-sm">
                    <FileIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <span className="truncate">{field.value.name}</span>
                  </span>
                )}
              </div>
              <FieldDescription>
                PDF, Word, Excel, PowerPoint, OpenDocument, RTF, TXT, CSV или ZIP до 20 МБ.
                Скачивается под исходным именем
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <FormInput
          control={form.control}
          name="title"
          label="Название"
          description="Так документ называется в списке на сайте"
          autoComplete="off"
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Загружаем…" : "Загрузить документ"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

function EditForm({ document }: { document: { id: number } & EditValues }) {
  const router = useRouter();
  const form = useForm<EditValues, unknown, z.output<typeof documentInputSchema>>({
    resolver: zodResolver(documentInputSchema),
    defaultValues: { title: document.title },
  });

  const { onSubmit, pending } = useActionSubmit(
    form,
    (values) => updateDocument(document.id, values),
    { successMessage: "Документ сохранён", onSuccess: () => router.refresh() },
  );

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup>
        <FormInput
          control={form.control}
          name="title"
          label="Название"
          description="Так документ называется в списке на сайте"
          autoComplete="off"
        />
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
