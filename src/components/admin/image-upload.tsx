"use client";

import { ImageIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { ActionResult } from "@/lib/action-result";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/lib/media";

export type UploadedImage = { id: number; url: string };

// Поле-картинка: значение — id в media. Файл загружается сразу при выборе через upload
// (server action с FormData: file), форма потом сохраняет только id.
export function FormImageUpload<T extends FieldValues>({
  control,
  name,
  label,
  description,
  upload,
  initialUrl,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  description?: string;
  upload: (formData: FormData) => Promise<ActionResult<UploadedImage>>;
  initialUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [pending, startTransition] = useTransition();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const onFile = (file: File | undefined) => {
          if (!file) return;
          if (file.size > MAX_IMAGE_BYTES) {
            toast.error("Файл больше 10 МБ");
            return;
          }
          const formData = new FormData();
          formData.set("file", file);
          startTransition(async () => {
            const result = await upload(formData);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setUrl(result.data.url);
            field.onChange(result.data.id);
          });
        };

        const hasImage = field.value != null && url !== null;

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <div className="flex items-end gap-4">
              <div className="bg-muted relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                {hasImage ? (
                  <Image
                    src={url}
                    alt="Текущее изображение"
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="text-muted-foreground size-8" aria-hidden />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={inputRef}
                  id={name}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  className="sr-only"
                  disabled={pending}
                  onChange={(event) => {
                    onFile(event.target.files?.[0]);
                    event.target.value = ""; // чтобы тот же файл можно было выбрать снова
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadIcon />
                  {pending ? "Загружаем…" : hasImage ? "Заменить" : "Загрузить"}
                </Button>
                {hasImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => field.onChange(null)}
                  >
                    <XIcon />
                    Убрать
                  </Button>
                )}
              </div>
            </div>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
