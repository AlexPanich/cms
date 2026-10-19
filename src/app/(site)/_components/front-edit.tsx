"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { createContext, type ReactNode, use, useState } from "react";
import { useForm } from "react-hook-form";
import { ButtonLink } from "@/components/admin/button-link";
import { FormInput, FormRichText, FormTextarea } from "@/components/admin/form-fields";
import type { GalleryOption } from "@/components/admin/gallery-node";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Toaster } from "@/components/ui/sonner";
import { z } from "@/lib/zod";
import { pageContentSchema, pageTitleSchema, textBodySchema } from "@/server/front-edit/schema";
import { saveFrontEdit } from "../actions";

// Правка на сайте. Эти компоненты рендерятся только для пользователей с правом edit_from_front
// (см. editable.tsx) и загружаются отдельным чанком (front-edit-lazy.tsx).

type FrontEditState = {
  enabled: boolean;
  // Открытый редактор. Одновременно правится одно поле.
  active: string | null;
  setActive: (id: string | null) => void;
};

const FrontEditContext = createContext<FrontEditState>({
  enabled: false,
  active: null,
  setActive: () => {},
});

// Панель с переключателем режима правки. Стоит в лейауте сайта, поэтому режим сохраняется
// при переходах между страницами.
export function FrontEditProvider({
  canOpenAdmin,
  children,
}: {
  canOpenAdmin: boolean;
  children: ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  return (
    <FrontEditContext value={{ enabled, active, setActive }}>
      {children}
      <aside
        aria-label="Правка на сайте"
        className="bg-background fixed right-4 bottom-4 z-50 flex gap-1 rounded-lg border p-1 shadow-lg"
      >
        <Button
          type="button"
          size="sm"
          variant={enabled ? "default" : "ghost"}
          aria-pressed={enabled}
          onClick={() => {
            setEnabled(!enabled);
            setActive(null);
          }}
        >
          <PencilIcon />
          Править на сайте
        </Button>
        {canOpenAdmin && (
          <ButtonLink href="/admin" size="sm" variant="ghost">
            Админка
          </ButtonLink>
        )}
      </aside>
      <Toaster richColors position="top-right" containerAriaLabel="Уведомления" />
    </FrontEditContext>
  );
}

// В режиме правки обводит содержимое и показывает кнопку, которая открывает редактор вместо него.
function EditableRegion({
  id,
  label,
  children,
  editor,
}: {
  id: string;
  label: string;
  children: ReactNode;
  editor: (close: () => void) => ReactNode;
}) {
  const { enabled, active, setActive } = use(FrontEditContext);
  if (active === id) return editor(() => setActive(null));
  if (!enabled) return children;

  return (
    <div className="outline-primary/50 relative min-h-8 rounded-sm outline-1 outline-offset-4 outline-dashed">
      {children}
      {active === null && (
        <Button
          type="button"
          size="xs"
          className="absolute -top-3 right-0 z-10"
          // Блоки бывают узкими (название сайта), поэтому на кнопке короткая подпись.
          aria-label={label}
          title={label}
          onClick={() => setActive(id)}
        >
          <PencilIcon />
          Изменить
        </Button>
      )}
    </div>
  );
}

function EditorForm({
  onSubmit,
  onCancel,
  pending,
  children,
}: {
  onSubmit: () => void;
  onCancel: () => void;
  pending: boolean;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={(event) => {
        if (event.key === "Escape") onCancel();
      }}
      className="bg-background w-full rounded-lg border p-3 shadow-sm"
    >
      <FieldGroup>
        {children}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Отмена
          </Button>
          <Button type="submit" disabled={pending}>
            Сохранить
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

const titleFormSchema = z.object({ title: pageTitleSchema });

export function PageTitleEditor({
  pageId,
  value,
  children,
}: {
  pageId: number;
  value: string;
  children: ReactNode;
}) {
  return (
    <EditableRegion
      id={`page.title:${pageId}`}
      label="Изменить заголовок"
      editor={(close) => <PageTitleForm pageId={pageId} value={value} onDone={close} />}
    >
      {children}
    </EditableRegion>
  );
}

function PageTitleForm({
  pageId,
  value,
  onDone,
}: {
  pageId: number;
  value: string;
  onDone: () => void;
}) {
  const form = useForm<z.input<typeof titleFormSchema>, unknown, z.output<typeof titleFormSchema>>({
    resolver: zodResolver(titleFormSchema),
    defaultValues: { title: value },
  });
  const { onSubmit, pending } = useActionSubmit(
    form,
    ({ title }) => saveFrontEdit({ field: "page.title", pageId, value: title }),
    { successMessage: "Заголовок сохранён", onSuccess: onDone },
  );

  return (
    <EditorForm onSubmit={onSubmit} onCancel={onDone} pending={pending}>
      <FormInput
        control={form.control}
        name="title"
        label="Заголовок страницы"
        autoComplete="off"
        autoFocus
      />
    </EditorForm>
  );
}

const contentFormSchema = z.object({ content: pageContentSchema });

export function PageContentEditor({
  pageId,
  value,
  galleries,
  children,
}: {
  pageId: number;
  value: z.input<typeof pageContentSchema>;
  galleries: GalleryOption[];
  children: ReactNode;
}) {
  return (
    <EditableRegion
      id={`page.content:${pageId}`}
      label="Изменить текст страницы"
      editor={(close) => (
        <PageContentForm pageId={pageId} value={value} galleries={galleries} onDone={close} />
      )}
    >
      {children}
    </EditableRegion>
  );
}

function PageContentForm({
  pageId,
  value,
  galleries,
  onDone,
}: {
  pageId: number;
  value: z.input<typeof pageContentSchema>;
  galleries: GalleryOption[];
  onDone: () => void;
}) {
  const form = useForm<
    z.input<typeof contentFormSchema>,
    unknown,
    z.output<typeof contentFormSchema>
  >({
    resolver: zodResolver(contentFormSchema),
    defaultValues: { content: value },
  });
  const { onSubmit, pending } = useActionSubmit(
    form,
    ({ content }) => saveFrontEdit({ field: "page.content", pageId, value: content }),
    { successMessage: "Текст страницы сохранён", onSuccess: onDone },
  );

  return (
    <EditorForm onSubmit={onSubmit} onCancel={onDone} pending={pending}>
      <FormRichText
        control={form.control}
        name="content"
        label="Текст страницы"
        galleries={galleries}
      />
    </EditorForm>
  );
}

const textFormSchema = z.object({ body: textBodySchema });

// Текст из раздела «Тексты» по ключу. multiline — многострочное поле (переводы строк сохраняются).
export function TextEditor({
  textKey,
  label,
  value,
  multiline = false,
  children,
}: {
  textKey: string;
  label: string;
  value: string;
  multiline?: boolean;
  children: ReactNode;
}) {
  return (
    <EditableRegion
      id={`text.body:${textKey}`}
      label={`Изменить: ${label.toLowerCase()}`}
      editor={(close) => (
        <TextForm
          textKey={textKey}
          label={label}
          value={value}
          multiline={multiline}
          onDone={close}
        />
      )}
    >
      {children}
    </EditableRegion>
  );
}

function TextForm({
  textKey,
  label,
  value,
  multiline,
  onDone,
}: {
  textKey: string;
  label: string;
  value: string;
  multiline: boolean;
  onDone: () => void;
}) {
  const form = useForm<z.input<typeof textFormSchema>, unknown, z.output<typeof textFormSchema>>({
    resolver: zodResolver(textFormSchema),
    defaultValues: { body: value },
  });
  const { onSubmit, pending } = useActionSubmit(
    form,
    ({ body }) => saveFrontEdit({ field: "text.body", key: textKey, value: body }),
    { successMessage: "Текст сохранён", onSuccess: onDone },
  );

  return (
    <EditorForm onSubmit={onSubmit} onCancel={onDone} pending={pending}>
      {multiline ? (
        <FormTextarea control={form.control} name="body" label={label} rows={4} autoFocus />
      ) : (
        <FormInput control={form.control} name="body" label={label} autoComplete="off" autoFocus />
      )}
    </EditorForm>
  );
}
