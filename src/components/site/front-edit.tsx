"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { createContext, type ReactNode, use, useId, useState } from "react";
import { type Control, type FieldValues, useForm } from "react-hook-form";
import { BlockFields } from "@/components/admin/blocks/block-fields";
import {
  BlockEditorProvider,
  type DocumentOption,
  type PageOption,
} from "@/components/admin/blocks/editor-context";
import { ButtonLink } from "@/components/admin/button-link";
import { FormInput, FormTextarea } from "@/components/admin/form-fields";
import type { GalleryOption } from "@/components/admin/gallery-node";
import { useActionSubmit } from "@/components/admin/use-action-submit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Toaster } from "@/components/ui/sonner";
import { z } from "@/lib/zod";
import { fieldsSchema } from "@/lib/blocks/define";
import { type Block, getBlockDefinition } from "@/lib/blocks/registry";
import { pickSettingsFields, type SiteSettingsKey } from "@/lib/site-settings";
import { pageTitleSchema, textBodySchema } from "@/server/front-edit/schema";
import { saveFrontEdit, uploadFrontEditImage } from "@/app/(site)/actions";

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

// Блок страницы: форма строится по полям его типа, как в админке, и открывается в диалоге.
// Сохраняется блок целиком по id; тип блока сервер берёт из страницы, а не из запроса.
export function BlockEditor({
  pageId,
  block,
  galleries,
  pages,
  documents,
  images,
  children,
}: {
  pageId: number;
  block: Block;
  galleries: GalleryOption[];
  pages: PageOption[];
  documents: DocumentOption[];
  images: Record<number, string>;
  children: ReactNode;
}) {
  const label = getBlockDefinition(block.type)?.label ?? block.type;
  return (
    <EditableRegion
      id={`page.block:${pageId}:${block.id}`}
      label={`Изменить блок «${label}»`}
      editor={(close) => (
        <>
          {children}
          <BlockEditorProvider
            galleries={galleries}
            pages={pages}
            documents={documents}
            images={images}
            upload={uploadFrontEditImage}
          >
            <BlockDialog pageId={pageId} block={block} label={label} onDone={close} />
          </BlockEditorProvider>
        </>
      )}
    >
      {children}
    </EditableRegion>
  );
}

function BlockDialog({
  pageId,
  block,
  label,
  onDone,
}: {
  pageId: number;
  block: Block;
  label: string;
  onDone: () => void;
}) {
  const definition = getBlockDefinition(block.type);
  const schema = z.object({ data: definition?.schema ?? z.never() });
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { data: block.data },
  });
  const { onSubmit, pending } = useActionSubmit(
    form,
    ({ data }) => saveFrontEdit({ field: "page.block", pageId, blockId: block.id, data }),
    { successMessage: "Блок сохранён", onSuccess: onDone },
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onDone()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Блок «{label}»</DialogTitle>
            <DialogDescription>
              Порядок блоков и оформление меняются в админке, в форме страницы
            </DialogDescription>
          </DialogHeader>
          {definition && (
            <BlockFields
              control={form.control as unknown as Control<FieldValues>}
              fields={definition.fields}
              name="data"
            />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Часть настроек сайта (поля из списка) — форма в диалоге, как у блока. Сохраняются только
// эти поля, остальные настройки сервер оставляет как есть.
export function SettingsEditor({
  fields,
  label,
  values,
  galleries,
  pages,
  documents,
  images,
  children,
}: {
  fields: SiteSettingsKey[];
  label: string;
  values: Record<string, unknown>;
  galleries: GalleryOption[];
  pages: PageOption[];
  documents: DocumentOption[];
  images: Record<number, string>;
  children: ReactNode;
}) {
  // Одни и те же настройки бывают на странице дважды (подвал и блок «Контакты»), а открыться
  // должен только тот редактор, кнопку которого нажали.
  const id = useId();
  return (
    <EditableRegion
      id={`settings:${id}`}
      label={`Изменить: ${label}`}
      editor={(close) => (
        <>
          {children}
          <BlockEditorProvider
            galleries={galleries}
            pages={pages}
            documents={documents}
            images={images}
            upload={uploadFrontEditImage}
          >
            <SettingsDialog fields={fields} label={label} values={values} onDone={close} />
          </BlockEditorProvider>
        </>
      )}
    >
      {children}
    </EditableRegion>
  );
}

function SettingsDialog({
  fields: names,
  label,
  values,
  onDone,
}: {
  fields: SiteSettingsKey[];
  label: string;
  values: Record<string, unknown>;
  onDone: () => void;
}) {
  const fields = pickSettingsFields(names);
  const form = useForm<FieldValues>({
    resolver: zodResolver(fieldsSchema(fields)),
    defaultValues: values,
  });
  const { onSubmit, pending } = useActionSubmit(
    form,
    (data) => saveFrontEdit({ field: "settings", data }),
    { successMessage: "Настройки сохранены", onSuccess: onDone },
  );

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onDone()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>Настройки сайта: {label}</DialogTitle>
            <DialogDescription>
              Остальные настройки — в админке, в разделе «Настройки сайта»
            </DialogDescription>
          </DialogHeader>
          <BlockFields control={form.control} fields={fields} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
              Отмена
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
