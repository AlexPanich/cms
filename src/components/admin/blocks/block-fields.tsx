"use client";

import { ArrowDownIcon, ArrowUpIcon, ImageIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useTransition } from "react";
import {
  type Control,
  Controller,
  type FieldValues,
  get,
  useFieldArray,
  useFormState,
} from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Field as BlockField,
  Fields,
  ImageField,
  ImageValue,
  LinkField,
  LinkValue,
  ListField,
} from "@/lib/blocks/define";
import { fieldsFormData } from "@/lib/blocks/form";
import { IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "@/lib/media";
import { FormCheckbox, FormInput, FormRichText, FormSelect, FormTextarea } from "../form-fields";
import { useBlockEditor } from "./editor-context";

// Форма блока строится по описанию полей (src/lib/blocks/define.ts). name — путь к данным
// блока в форме: «blocks.2.data» в админке, «data» в правке на сайте.

type FieldProps<F extends BlockField = BlockField> = {
  control: Control<FieldValues>;
  field: F;
  name: string;
};

type ErrorLike = { message?: string } | undefined;

// Ошибки вложенных значений (alt картинки, адрес ссылки) — под полем целиком.
function nestedErrors(error: unknown, keys: readonly string[]): ErrorLike[] {
  const errors = error as Record<string, ErrorLike> | undefined;
  return [errors as ErrorLike, ...keys.map((key) => errors?.[key])];
}

export function BlockFields({
  control,
  fields,
  name,
}: {
  control: Control<FieldValues>;
  fields: Fields;
  name: string;
}) {
  return (
    <FieldGroup>
      {Object.entries(fields).map(([key, item]) => (
        <BlockFieldInput key={key} control={control} field={item} name={`${name}.${key}`} />
      ))}
    </FieldGroup>
  );
}

function BlockFieldInput({ control, field: item, name }: FieldProps) {
  const { galleries } = useBlockEditor();
  const common = { control, name, label: item.label, description: item.help };

  switch (item.kind) {
    case "text":
      return item.multiline ? (
        <FormTextarea {...common} rows={3} maxLength={item.max} />
      ) : (
        <FormInput {...common} maxLength={item.max} autoComplete="off" />
      );
    case "richText":
      return <FormRichText {...common} galleries={galleries} />;
    case "select":
      return <FormSelect {...common} options={item.options} />;
    case "boolean":
      return <FormCheckbox {...common} />;
    case "image":
      return <ImageInput control={control} field={item} name={name} />;
    case "link":
      return <LinkInput control={control} field={item} name={name} />;
    case "list":
      return <ListInput control={control} field={item} name={name} />;
  }
}

// 1.777… → «16:9». Пропорции из описания поля подсказывают, какую картинку загружать.
export function formatAspect(aspect: number): string {
  for (let height = 1; height <= 20; height++) {
    const width = Math.round(aspect * height);
    if (Math.abs(width / height - aspect) < 0.01) return `${width}:${height}`;
  }
  return aspect.toFixed(2);
}

function ImageInput({ control, field: item, name }: FieldProps<ImageField>) {
  const { imageUrl, upload, rememberImage } = useBlockEditor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const hint = [
    item.help,
    item.aspect && `Тема обрежет картинку до пропорций ${formatAspect(item.aspect)}`,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as ImageValue | null;
        const url = value ? imageUrl(value.mediaId) : undefined;

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
            rememberImage(result.data);
            field.onChange({ mediaId: result.data.id, alt: value?.alt ?? "" });
          });
        };

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={name}>{item.label}</FieldLabel>
            <div className="flex flex-wrap items-end gap-4">
              <div
                className="bg-muted relative flex h-32 max-w-56 min-w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border"
                style={{ aspectRatio: item.aspect ?? 1 }}
              >
                {url ? (
                  <Image src={url} alt="" fill sizes="224px" className="object-cover" />
                ) : value ? (
                  <span className="text-muted-foreground p-2 text-center text-xs">
                    Картинка удалена из медиатеки
                  </span>
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
                  {pending ? "Загружаем…" : value ? "Заменить" : "Загрузить"}
                </Button>
                {value && (
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
            {value && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor={`${name}.alt`} className="font-normal">
                  Описание картинки (alt)
                </FieldLabel>
                <Input
                  id={`${name}.alt`}
                  value={value.alt}
                  maxLength={300}
                  autoComplete="off"
                  onChange={(event) => field.onChange({ ...value, alt: event.target.value })}
                  onBlur={field.onBlur}
                />
                <FieldDescription>Если пусто — описание из медиатеки</FieldDescription>
              </div>
            )}
            {hint && <FieldDescription>{hint}</FieldDescription>}
            <FieldError errors={nestedErrors(fieldState.error, ["mediaId", "alt"])} />
          </Field>
        );
      }}
    />
  );
}

const NO_LINK = "none";

function LinkInput({ control, field: item, name }: FieldProps<LinkField>) {
  const { pages } = useBlockEditor();
  const kindItems = [
    ...(item.required ? [] : [{ value: NO_LINK, label: "Без ссылки" }]),
    { value: "page", label: "Страница сайта" },
    { value: "url", label: "Другой адрес" },
  ];
  const pageItems = pages.map((page) => ({
    value: String(page.id),
    label: `${"— ".repeat(page.depth)}${page.title}`,
  }));

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as LinkValue | null;
        const label = value?.label ?? "";

        const onKind = (kind: string | null) => {
          if (kind === NO_LINK || kind === null) return field.onChange(null);
          if (kind === value?.kind) return;
          field.onChange(
            kind === "page"
              ? { kind, pageId: pages[0]?.id ?? 0, label }
              : { kind: "url", url: "", label },
          );
        };

        return (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend variant="label">{item.label}</FieldLegend>
            <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
              <Select
                items={kindItems}
                value={value?.kind ?? (item.required ? null : NO_LINK)}
                onValueChange={onKind}
              >
                <SelectTrigger
                  id={`${name}.kind`}
                  className="w-full"
                  aria-label={`${item.label}: куда ведёт`}
                >
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  {kindItems.map((kind) => (
                    <SelectItem key={kind.value} value={kind.value}>
                      {kind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {value?.kind === "page" && (
                <Select
                  items={pageItems}
                  value={value.pageId ? String(value.pageId) : null}
                  onValueChange={(pageId) =>
                    pageId && field.onChange({ ...value, pageId: Number(pageId) })
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={`${item.label}: страница`}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Выберите страницу" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageItems.map((page) => (
                      <SelectItem key={page.value} value={page.value}>
                        {page.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {value?.kind === "url" && (
                <Input
                  value={value.url}
                  aria-label={`${item.label}: адрес`}
                  placeholder="https://… или /раздел"
                  maxLength={2000}
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => field.onChange({ ...value, url: event.target.value })}
                  onBlur={field.onBlur}
                />
              )}
            </div>
            {value && (
              <Input
                value={label}
                aria-label={`${item.label}: подпись`}
                placeholder={
                  value.kind === "page" ? "Подпись: название страницы" : "Подпись: адрес ссылки"
                }
                maxLength={100}
                autoComplete="off"
                onChange={(event) => field.onChange({ ...value, label: event.target.value })}
                onBlur={field.onBlur}
              />
            )}
            {item.help && <FieldDescription>{item.help}</FieldDescription>}
            <FieldError errors={nestedErrors(fieldState.error, ["pageId", "url", "label"])} />
          </FieldSet>
        );
      }}
    />
  );
}

function ListInput({ control, field: item, name }: FieldProps<ListField>) {
  const { fields, append, remove, move } = useFieldArray({ control, name, keyName: "_key" });
  const { errors } = useFormState({ control, name });
  // Ошибка списка целиком (меньше min, больше max): zodResolver кладёт её в root.
  const error = get(errors, name) as (ErrorLike & { root?: ErrorLike }) | undefined;
  const title = (index: number) => `${item.itemLabel} ${index + 1}`;

  return (
    <FieldSet data-invalid={Boolean(error?.message || error?.root)}>
      <FieldLegend variant="label">{item.label}</FieldLegend>
      {item.help && <FieldDescription>{item.help}</FieldDescription>}
      {fields.map((element, index) => (
        <FieldSet key={element._key} className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <FieldLegend variant="label" className="mb-0">
              {title(index)}
            </FieldLegend>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Поднять: ${title(index)}`}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Опустить: ${title(index)}`}
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Удалить: ${title(index)}`}
                onClick={() => remove(index)}
              >
                <XIcon />
              </Button>
            </div>
          </div>
          <BlockFields control={control} fields={item.of} name={`${name}.${index}`} />
        </FieldSet>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={fields.length >= item.max}
          onClick={() => append(fieldsFormData(item.of))}
        >
          <PlusIcon />
          Добавить: {item.itemLabel.toLowerCase()}
        </Button>
      </div>
      <FieldDescription>
        {item.min > 0 ? `От ${item.min} до ${item.max}` : `До ${item.max}`}
      </FieldDescription>
      <FieldError errors={[error?.root, error?.message ? error : undefined]} />
    </FieldSet>
  );
}
